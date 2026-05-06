/**
 * Verifica del magic-byte signature di un file.
 * Mai fidarsi del MIME type dichiarato dal client. Questa funzione legge
 * i primi byte del Buffer e li confronta con le signature note dei formati attesi.
 */

type AllowedImage = "image/png" | "image/jpeg" | "image/webp";

function startsWith(buf: Uint8Array, signature: number[]): boolean {
  if (buf.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buf[i] !== signature[i]) return false;
  }
  return true;
}

function isPng(buf: Uint8Array): boolean {
  return startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function isJpeg(buf: Uint8Array): boolean {
  return startsWith(buf, [0xff, 0xd8, 0xff]);
}

function isWebp(buf: Uint8Array): boolean {
  // RIFF .... WEBP
  if (buf.length < 12) return false;
  return (
    startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50 // "WEBP"
  );
}

export function detectImageMime(buf: Uint8Array): AllowedImage | null {
  if (isPng(buf)) return "image/png";
  if (isJpeg(buf)) return "image/jpeg";
  if (isWebp(buf)) return "image/webp";
  return null;
}

/**
 * Verifica che il File abbia un magic-byte coerente con il MIME atteso.
 * Restituisce il MIME effettivo o null se non è una immagine consentita.
 */
export async function verifyImageFile(file: File): Promise<AllowedImage | null> {
  const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return detectImageMime(buf);
}
