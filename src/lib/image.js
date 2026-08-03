// Client-side image compression for photo uploads.
// Resizes to a reasonable max dimension and re-encodes as WebP before upload,
// which drastically cuts storage/bandwidth for phone camera photos (often 4-8MB each).

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 350 * 1024; // not worth compressing small files

function loadImage(objectUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = objectUrl;
  });
}

/**
 * Compresses a single image File to WebP, capped at `maxDimension` on its longest side.
 * Falls back to the original file untouched if compression fails or doesn't help
 * (e.g. HEIC files most browsers can't decode via <img>, or already-tiny files).
 */
export async function compressImage(file, options = {}) {
  const { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = options;

  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.size < SKIP_BELOW_BYTES) return file;

  let objectUrl;
  try {
    objectUrl = URL.createObjectURL(file);
    const img = await loadImage(objectUrl);
    const { naturalWidth: width, naturalHeight: height } = img;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, '') + '.webp';
    return new File([blob], newName, { type: 'image/webp', lastModified: Date.now() });
  } catch (err) {
    console.warn('[compressImage] falling back to original file:', err.message);
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export async function compressImages(files, options = {}) {
  return Promise.all(files.map((file) => compressImage(file, options)));
}
