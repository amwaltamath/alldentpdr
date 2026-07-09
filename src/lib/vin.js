export function normalizeVin(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function extractVin(value) {
  const normalized = normalizeVin(value)
    .replace(/[IOQ]/g, (char) => (char === 'I' ? '1' : '0'));
  const match = normalized.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match ? match[0] : '';
}

/** Crop the center scan band (matches the on-screen reticle). */
export function cropVinScanRegion(sourceCanvas) {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const x = Math.round(sw * 0.1);
  const y = Math.round(sh * 0.3);
  const w = Math.round(sw * 0.8);
  const h = Math.round(sh * 0.4);

  const cropped = document.createElement('canvas');
  cropped.width = w;
  cropped.height = h;
  const ctx = cropped.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.6 + 128));
    data[i] = data[i + 1] = data[i + 2] = boosted;
  }
  ctx.putImageData(imageData, 0, 0);

  return cropped;
}

export async function recognizeVinFromImage(image) {
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: () => {},
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',
    });

    const result = await worker.recognize(image);
    return extractVin(result?.data?.text || '');
  } finally {
    await worker.terminate();
  }
}

export async function decodeVin(rawVin) {
  const vin = normalizeVin(rawVin);
  if (vin.length !== 17) {
    throw new Error('A full 17-character VIN is required');
  }

  const response = await fetch('/api/vin-decode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vin }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'Unable to decode that VIN right now.');
  }

  return {
    vehicle: data.vehicle || {},
    message: data.message || 'Vehicle details loaded from VIN.',
  };
}
