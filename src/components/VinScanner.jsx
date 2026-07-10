import { useEffect, useRef, useState } from 'react';
import { cropVinScanRegion, extractVin, recognizeVinFromImage } from '../lib/vin';

function stopCamera(videoEl) {
  const stream = videoEl?.srcObject;
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => track.stop());
  }
  if (videoEl) videoEl.srcObject = null;
}

export default function VinScanner({ onScan, onClose, onManualEntry }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const activeRef = useRef(true);
  const [cameraError, setCameraError] = useState('');
  const [scanFeedback, setScanFeedback] = useState('');
  const [ready, setReady] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

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

      cleanupScanner();
      onScan(vin);
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

    import('@zxing/browser').then(async ({ BrowserMultiFormatReader }) => {
      if (!activeRef.current) return;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const decodeHandler = (result, err) => {
        if (!activeRef.current) return;

        if (result) {
          setReady(true);
          const vin = extractVin(result.getText().replace(/\*/g, ''));
          if (vin.length === 17) {
            cleanupScanner();
            onScan(vin);
          }
        }

        if (err && err.name !== 'NotFoundException') {
          console.warn('[VinScanner]', err);
        }

        setReady(true);
      };

      try {
        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
            },
          },
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

          const preferred = devices.find((device) => /back|rear|environment/i.test(device.label)) || devices[devices.length - 1];
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
          Point the camera at the VIN barcode on the door jamb sticker, windshield, or QR code.
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
            <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#111', minHeight: 180 }}>
              <video
                ref={videoRef}
                style={{ width: '100%', display: 'block' }}
                muted
                playsInline
              />
              {ready && <div className="vin-scan-reticle" />}
              {!ready && (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '48px 16px', fontSize: 13, margin: 0, position: 'absolute', inset: 0 }}>
                  Starting camera…
                </p>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button ghost btn-scan-vin"
                onClick={captureAndReadVinText}
                disabled={ocrBusy || !ready}
              >
                {ocrBusy ? 'Reading Text…' : 'Read VIN Text'}
              </button>
              {ocrProgress ? (
                <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{ocrProgress}</span>
              ) : null}
            </div>
            {scanFeedback ? (
              <p className="vin-scanner-error" style={{ margin: '12px 0 0' }}>
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
