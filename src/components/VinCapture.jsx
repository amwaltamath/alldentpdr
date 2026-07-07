import React, { useEffect, useRef, useState } from 'react';

const VIN_REGEX = /\b[A-HJ-NPR-Z0-9]{17}\b/;

function extractVin(value) {
  if (!value) return '';
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = normalized.match(VIN_REGEX);
  return match ? match[0] : '';
}

function extractRegistration(value) {
  if (!value) return '';
  const lines = value
    .toUpperCase()
    .split(/\r?\n/)
    .map((line) => line.replace(/[^A-Z0-9\- ]/g, '').trim())
    .filter(Boolean);

  const candidates = lines
    .map((line) => line.replace(/\s+/g, ''))
    .filter((line) => line.length >= 5 && line.length <= 12 && /[A-Z]/.test(line) && /\d/.test(line));

  return candidates[0] || '';
}

export default function VinCapture() {
  const [vin, setVin] = useState('');
  const [registration, setRegistration] = useState('');
  const [scanTarget, setScanTarget] = useState(null);
  const [status, setStatus] = useState('');
  const [decodeStatus, setDecodeStatus] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedVehicle, setDecodedVehicle] = useState({
    year: '',
    make: '',
    model: '',
    trim: '',
    bodyClass: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationRef = useRef(null);
  const scanTargetRef = useRef(null);
  const lastDecodedVinRef = useRef('');

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (vin.length !== 17) {
      return;
    }

    const decodeTimer = window.setTimeout(() => {
      decodeVin(vin);
    }, 300);

    return () => {
      window.clearTimeout(decodeTimer);
    };
  }, [vin]);

  function getVehicleLabel(vehicleData) {
    return [vehicleData.year, vehicleData.make, vehicleData.model, vehicleData.trim]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  const hasDecodedVehicle = Boolean(decodedVehicle.year || decodedVehicle.make || decodedVehicle.model || decodedVehicle.trim || decodedVehicle.bodyClass);

  function setVehicleFieldValue(vehicleLabel) {
    if (typeof document === 'undefined' || !vehicleLabel) return;
    const field = document.getElementById('vehicle-field');
    if (!field) return;
    field.value = vehicleLabel;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function decodeVin(value) {
    const parsedVin = extractVin(value);
    if (!parsedVin || parsedVin === lastDecodedVinRef.current || isDecoding) {
      return;
    }

    setIsDecoding(true);
    setDecodeStatus('Decoding VIN...');

    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${parsedVin}?format=json`);
      if (!response.ok) {
        throw new Error('Decode request failed');
      }

      const payload = await response.json();
      const result = payload?.Results?.[0];

      if (!result) {
        throw new Error('No decode result returned');
      }

      const nextVehicle = {
        year: result.ModelYear || '',
        make: result.Make || '',
        model: result.Model || '',
        trim: result.Trim || '',
        bodyClass: result.BodyClass || '',
      };

      const vehicleLabel = getVehicleLabel(nextVehicle);
      if (!vehicleLabel) {
        setDecodeStatus('VIN decoded, but no vehicle details were returned.');
        setIsDecoding(false);
        return;
      }

      setDecodedVehicle(nextVehicle);
      setVehicleFieldValue(vehicleLabel);
      setDecodeStatus(`Vehicle found: ${vehicleLabel}`);
      lastDecodedVinRef.current = parsedVin;
    } catch (error) {
      setDecodeStatus('Unable to decode VIN details right now. You can still enter vehicle info manually.');
    } finally {
      setIsDecoding(false);
    }
  }

  async function ensureDetector() {
    if (detectorRef.current || typeof window === 'undefined') {
      return detectorRef.current;
    }

    if ('BarcodeDetector' in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'pdf417', 'data_matrix', 'aztec'],
        });
      } catch (error) {
        detectorRef.current = null;
      }
    }

    return detectorRef.current;
  }

  function stopScanner() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function closeScanner(keepStatus = false) {
    scanTargetRef.current = null;
    stopScanner();
    setScanTarget(null);
    if (!keepStatus) {
      setStatus('');
    }
    setIsProcessing(false);
  }

  function assignValue(value, sourceTarget) {
    if (!value) return false;

    if (sourceTarget === 'vin') {
      const parsedVin = extractVin(value);
      if (parsedVin) {
        setVin(parsedVin);
        setStatus('VIN captured successfully.');
        closeScanner(true);
        return true;
      }
      return false;
    }

    if (sourceTarget === 'registration') {
      const parsedRegistration = extractRegistration(value);
      if (parsedRegistration) {
        setRegistration(parsedRegistration);
        setStatus('Registration captured successfully.');
        closeScanner(true);
        return true;
      }
      return false;
    }

    return false;
  }

  async function scanBarcodesFromSource(source, sourceTarget) {
    const detector = await ensureDetector();
    if (!detector) {
      return false;
    }

    try {
      const barcodes = await detector.detect(source);
      if (!barcodes.length) {
        return false;
      }

      for (const code of barcodes) {
        const value = code.rawValue || '';
        if (assignValue(value, sourceTarget)) {
          return true;
        }
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  async function runOcr(sourceTarget) {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const canvas = canvasRef.current;
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      if (!data?.text) {
        return false;
      }

      return assignValue(data.text, sourceTarget);
    } catch (error) {
      return false;
    }
  }

  function startLiveBarcodeLoop(target) {
    const loop = async () => {
      if (!videoRef.current || scanTargetRef.current !== target) {
        return;
      }

      const found = await scanBarcodesFromSource(videoRef.current, target);
      if (found) {
        return;
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
  }

  async function openScanner(target) {
    setStatus('');
    scanTargetRef.current = target;
    setScanTarget(target);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      startLiveBarcodeLoop(target);
    } catch (error) {
      setStatus('Camera access failed. Please allow camera permission and try again.');
      closeScanner(true);
    }
  }

  async function captureFrame() {
    if (!videoRef.current || !canvasRef.current || !scanTarget || isProcessing) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setStatus('Unable to process camera frame.');
      return;
    }

    setIsProcessing(true);
    setStatus('Analyzing capture...');

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const barcodeFound = await scanBarcodesFromSource(canvas, scanTarget);
    if (barcodeFound) {
      setIsProcessing(false);
      return;
    }

    const ocrFound = await runOcr(scanTarget);
    if (!ocrFound) {
      setStatus('No readable VIN/registration found. Move closer, improve lighting, and try again.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);
  }

  return (
    <div className="vin-capture-card">
      <label>
        Vehicle registration number
        <div className="scan-field-row">
          <input
            type="text"
            name="registration"
            value={registration}
            onChange={(event) => setRegistration(event.target.value.toUpperCase())}
            placeholder="Plate / registration"
          />
          <button type="button" className="button ghost scan-button" onClick={() => openScanner('registration')}>
            Scan
          </button>
        </div>
      </label>

      <label>
        VIN (17 characters)
        <div className="scan-field-row">
          <input
            type="text"
            name="vin"
            value={vin}
            maxLength={17}
            onChange={(event) => {
              const nextVin = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              setVin(nextVin);
              if (nextVin !== lastDecodedVinRef.current) {
                setDecodedVehicle({ year: '', make: '', model: '', trim: '', bodyClass: '' });
                setDecodeStatus('');
              }
            }}
            placeholder="1HGCM82633A123456"
          />
          <button type="button" className="button ghost scan-button" onClick={() => openScanner('vin')}>
            Scan VIN
          </button>
        </div>
      </label>

      {decodeStatus && <p className="scanner-status scanner-status-inline">{decodeStatus}</p>}
      {isDecoding && <p className="scanner-status scanner-status-inline">Looking up vehicle data...</p>}

      {hasDecodedVehicle && (
        <div className="decoded-vehicle-card" aria-live="polite">
          <p className="decoded-vehicle-title">Decoded vehicle details</p>
          <p className="decoded-vehicle-main">{getVehicleLabel(decodedVehicle) || 'Vehicle details found'}</p>
          <div className="decoded-vehicle-grid">
            {decodedVehicle.year && <span><strong>Year:</strong> {decodedVehicle.year}</span>}
            {decodedVehicle.make && <span><strong>Make:</strong> {decodedVehicle.make}</span>}
            {decodedVehicle.model && <span><strong>Model:</strong> {decodedVehicle.model}</span>}
            {decodedVehicle.trim && <span><strong>Trim:</strong> {decodedVehicle.trim}</span>}
            {decodedVehicle.bodyClass && <span><strong>Body:</strong> {decodedVehicle.bodyClass}</span>}
          </div>
        </div>
      )}

      <input type="hidden" name="vehicle_year" value={decodedVehicle.year} />
      <input type="hidden" name="vehicle_make" value={decodedVehicle.make} />
      <input type="hidden" name="vehicle_model" value={decodedVehicle.model} />
      <input type="hidden" name="vehicle_trim" value={decodedVehicle.trim} />
      <input type="hidden" name="vehicle_body_class" value={decodedVehicle.bodyClass} />

      {scanTarget && (
        <div className="scanner-modal" role="dialog" aria-modal="true" aria-label="VIN scanner">
          <div className="scanner-panel">
            <h4>{scanTarget === 'vin' ? 'Scan VIN barcode / QR / text' : 'Scan registration barcode / QR / text'}</h4>
            <p>Point camera at barcode, QR code, or printed text, then tap capture if not auto-detected.</p>
            <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="scanner-canvas" aria-hidden="true" />
            <div className="button-row">
              <button type="button" className="button primary" onClick={captureFrame} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Capture'}
              </button>
              <button type="button" className="button ghost" onClick={closeScanner}>
                Cancel
              </button>
            </div>
            {status && <p className="scanner-status">{status}</p>}
          </div>
        </div>
      )}

      {!scanTarget && status && <p className="scanner-status scanner-status-inline">{status}</p>}
    </div>
  );
}
