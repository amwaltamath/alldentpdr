import { useEffect, useRef, useState } from 'react';
import { cropVinScanRegion, extractVin, recognizeVinFromImage } from '../lib/vin';

function stopCamera(videoEl) {
  const stream = videoEl?.srcObject;
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => track.stop());
  }
  if (videoEl) videoEl.srcObject = null;
}

function truncateText(value, max = 42) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export default function VinScanner({ onScan, onClose, onManualEntry }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const activeRef = useRef(true);
  const scannedRef = useRef(false);
  const invalidScanRef = useRef({ text: '', at: 0 });
  const [cameraError, setCameraError] = useState('');
  const [scanFeedback, setScanFeedback] = useState('');
  const [ready, setReady] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [lastFormat, setLastFormat] = useState('');

  const cleanupScanner = () => {
    activeRef.current = false;
    readerRef.current?.reset();
    stopCamera(videoRef.current);
  };

  const returnToManualEntry = (message) => {
    cleanupScanner();
    if (onManualEntry) {
      onManualEntry(message);
      return;
    }
    onClose();
  };

  const acceptVin = (vin) => {
    if (scannedRef.current || !activeRef.current) return;
    scannedRef.current = true;
    cleanupScanner();
    onScan(vin);
  };

  const handleDecodedText = (rawText, formatName = '') => {
    if (!activeRef.current || scannedRef.current) return;

    if (formatName) setLastFormat(formatName);

    const vin = extractVin(rawText);
    if (vin.length === 17) {
      setScanFeedback('');
      acceptVin(vin);
      return;
    }

    const now = Date.now();
    const snippet = truncateText(rawText);
    if (snippet && (snippet !== invalidScanRef.current.text || now - invalidScanRef.current.at > 3500)) {
      invalidScanRef.current = { text: snippet, at: now };
      setScanFeedback(
        formatName
          ? `Scanned ${formatName} but no valid VIN found (${snippet}). Align the barcode or QR code in the frame.`
          : `Scanned "${snippet}" but no valid 17-character VIN found. Try again or use Read VIN Text.`
      );
    }
  };

  const captureAndReadVinText = async () => {
    if (ocrBusy) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setScanFeedback('Camera is not ready yet. Wait for the preview, then try again.');
      return;
    }

    setScanFeedback('');
    setOcrProgress('Capturing image…');
    setOcrBusy(true);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        throw new Error('Could not access camera frame.');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const cropped = cropVinScanRegion(canvas);

      setOcrProgress('Reading VIN text…');

      let vin = await recognizeVinFromImage(cropped);
      if (!vin) {
        setOcrProgress('Trying full frame…');
        vin = await recognizeVinFromImage(canvas);
      }

      if (!vin) {
        returnToManualEntry('Could not read a VIN from the photo. Please type your 17-character VIN below.');
        return;
      }

      acceptVin(vin);
    } catch (err) {
      console.error('[VinScanner OCR]', err);
      returnToManualEntry('VIN text scan failed. Please type your 17-character VIN below.');
    } finally {
      setOcrBusy(false);
      setOcrProgress('');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    activeRef.current = true;
    scannedRef.current = false;

    Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ]).then(async ([{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }]) => {
      if (!activeRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_128,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.PDF_417,
        BarcodeFormat.AZTEC,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.ASSUME_GS1, true);

      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
      readerRef.current = reader;

      const decodeHandler = (result, err) => {
        if (!activeRef.current) return;

        if (result) {
          setReady(true);
          const formatEnum = result.getBarcodeFormat?.();
          const formatName = formatEnum != null
            ? String(formatEnum).replace(/_/g, ' ').toLowerCase()
            : 'barcode';
          handleDecodedText(result.getText() || '', formatName);
        }

        if (err && err.name !== 'NotFoundException') {
          console.warn('[VinScanner]', err);
        }

        setReady(true);
      };

      const videoConstraints = {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };

      try {
        await reader.decodeFromConstraints(
          { video: videoConstraints },
          videoRef.current,
          decodeHandler
        );
        return;
      } catch (constraintErr) {
        console.warn('[VinScanner constraints fallback]', constraintErr);
      }

      BrowserMultiFormatReader.listVideoInputDevices()
        .then((devices) => {
          if (!activeRef.current) return;
          if (!devices.length) {
            setCameraError('No camera found.');
            return;
          }

          const preferred = devices.find((device) => /back|rear|environment/i.test(device.label))
            || devices[devices.length - 1];
          return reader.decodeFromVideoDevice(preferred.deviceId, videoRef.current, decodeHandler);
        })
        .catch((err) => {
          console.error('[VinScanner camera]', err);
          if (activeRef.current) setCameraError('Camera access was denied.');
        });
    }).catch((err) => {
      console.error('[VinScanner import]', err);
      if (activeRef.current) setCameraError('Scanner failed to load.');
    });

    return () => {
      cleanupScanner();
    };
  }, [onScan]);

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  return (
    <div className="vin-scanner-overlay" onClick={handleClose}>
      <div className="vin-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vin-scanner-head">
          <h3>Scan VIN</h3>
          <button type="button" className="job-drawer-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>
        <p className="vin-scanner-hint">
          Point the camera at the VIN barcode (Code 39 / Code 128), QR code on the door jamb sticker, or printed VIN text.
        </p>

        {cameraError ? (
          <div className="vin-scanner-fallback">
            <p className="vin-scanner-error">{cameraError}</p>
            <p className="vin-scanner-error-sub">You can still enter the VIN manually on the form.</p>
            <button
              type="button"
              className="button primary"
              onClick={() => returnToManualEntry('Camera unavailable. Please type your 17-character VIN below.')}
            >
              Enter VIN manually
            </button>
          </div>
        ) : (
          <>
            <div className="vin-scanner-preview">
              <video
                ref={videoRef}
                className="vin-scanner-video"
                muted
                playsInline
                autoPlay
              />
              {ready && <div className="vin-scan-reticle" aria-hidden="true" />}
              {!ready && (
                <p className="vin-scanner-loading">Starting camera…</p>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="vin-scanner-toolbar">
              <button
                type="button"
                className="button ghost btn-scan-vin"
                onClick={captureAndReadVinText}
                disabled={ocrBusy || !ready}
              >
                {ocrBusy ? 'Reading Text…' : 'Read VIN Text'}
              </button>
              <span className="vin-scanner-status">
                {ocrProgress || (ready ? (lastFormat ? `Scanning (${lastFormat})…` : 'Scanning for barcode or QR…') : '')}
              </span>
            </div>
            {scanFeedback ? (
              <p className="vin-scanner-error vin-scanner-feedback">
                {scanFeedback}
              </p>
            ) : null}
          </>
        )}

        <div className="vin-scanner-actions">
          {!cameraError ? (
            <button
              type="button"
              className="button primary sm"
              onClick={() => returnToManualEntry('Enter your 17-character VIN in the field below.')}
            >
              Enter VIN manually
            </button>
          ) : null}
          <button type="button" className="button ghost sm" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
