import { useEffect, useRef, useState } from 'react';
import { cropVinScanRegion, extractVin, recognizeVinFromImage } from '../lib/vin';

export default function VinScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [scanFeedback, setScanFeedback] = useState('');
  const [ready, setReady] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

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
        setScanFeedback('No VIN found. Center the 17-character VIN in the box and try again, or enter it manually.');
        return;
      }

      onScan(vin);
    } catch (err) {
      console.error('[VinScanner OCR]', err);
      setScanFeedback('Text scan failed. Try again or enter the VIN manually.');
    } finally {
      setOcrBusy(false);
      setOcrProgress('');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;

    import('@zxing/browser').then(async ({ BrowserMultiFormatReader }) => {
      if (!active) return;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const decodeHandler = (result, err) => {
        if (!active) return;

        if (result) {
          setReady(true);
          const vin = extractVin(result.getText().replace(/\*/g, ''));
          if (vin.length === 17) {
            active = false;
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
          if (!active) return;
          if (!devices.length) {
            setCameraError('No camera found. Please enter the VIN manually.');
            return;
          }

          const preferred = devices.find((device) => /back|rear|environment/i.test(device.label)) || devices[devices.length - 1];
          return reader.decodeFromVideoDevice(preferred.deviceId, videoRef.current, decodeHandler);
        })
        .catch((err) => {
          console.error('[VinScanner camera]', err);
          if (active) setCameraError('Camera access denied. Please allow camera access or enter the VIN manually.');
        });
    }).catch((err) => {
      console.error('[VinScanner import]', err);
      if (active) setCameraError('Scanner failed to load. Please enter the VIN manually.');
    });

    return () => {
      active = false;
      readerRef.current?.reset();
    };
  }, [onScan]);

  return (
    <div className="vin-scanner-overlay" onClick={onClose}>
      <div className="vin-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vin-scanner-head">
          <h3>Scan VIN</h3>
          <button type="button" className="job-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="vin-scanner-hint">
          Point the camera at the VIN barcode on the door jamb sticker, windshield, or QR code.
        </p>

        {cameraError ? (
          <p style={{ color: 'var(--rust,#b0522b)', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>
            {cameraError}
          </p>
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
              <p style={{ color: 'var(--rust,#b0522b)', fontSize: 13, lineHeight: 1.45, margin: '12px 0 0' }}>
                {scanFeedback}
              </p>
            ) : null}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" className="button ghost sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
