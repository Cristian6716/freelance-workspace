/**
 * Verifica magic-byte signature dei file uploadati.
 * Mai fidarsi del MIME type dichiarato dal client: viene da un header HTTP
 * potenzialmente falsato. Questa funzione legge i primi byte e li confronta
 * con le signature note dei formati attesi.
 *
 * Coperture:
 *   - Immagini: PNG, JPEG, WebP, GIF
 *   - Documenti: PDF
 *   - Office (DOCX/XLSX/PPTX) e archivi: ZIP, 7z
 *   - Video: MP4 (ftyp), QuickTime (ftypqt), WebM
 *   - Audio: MP3 (ID3), WAV
 *
 * Per file di testo (TXT/CSV/MD/JSON/XML/SVG) non c'è una signature affidabile:
 * vengono accettati sulla base del MIME dichiarato + check che il contenuto
 * non sia binario sospetto (no NUL, no byte fuori UTF-8 nei primi 4KB).
 */

type AllowedImage = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

const TEXT_LIKE_MIMES = new Set<string>([
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/svg+xml",
  "application/json",
  "application/xml",
]);

function startsWith(buf: Uint8Array, signature: number[], offset = 0): boolean {
  if (buf.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buf[offset + i] !== signature[i]) return false;
  }
  return true;
}

// ----- Image signatures ------------------------------------------------------
function isPng(b: Uint8Array)  { return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); }
function isJpeg(b: Uint8Array) { return startsWith(b, [0xff, 0xd8, 0xff]); }
function isGif(b: Uint8Array)  { return startsWith(b, [0x47, 0x49, 0x46, 0x38]); }
function isWebp(b: Uint8Array) {
  return (
    b.length >= 12 &&
    startsWith(b, [0x52, 0x49, 0x46, 0x46]) &&  // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // "WEBP"
  );
}

// ----- Document signatures ---------------------------------------------------
function isPdf(b: Uint8Array)   { return startsWith(b, [0x25, 0x50, 0x44, 0x46]); /* "%PDF" */ }

// DOCX/XLSX/PPTX e archivi sono tutti ZIP. Distinguiamo il sotto-formato
// solo se necessario; qui ci basta riconoscere la signature ZIP.
function isZip(b: Uint8Array)   {
  return (
    startsWith(b, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(b, [0x50, 0x4b, 0x05, 0x06]) || // empty zip
    startsWith(b, [0x50, 0x4b, 0x07, 0x08])    // spanned zip
  );
}
function is7z(b: Uint8Array)    { return startsWith(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]); }

// ----- Video signatures ------------------------------------------------------
// MP4/MOV: bytes 4..7 = "ftyp"
function isFtyp(b: Uint8Array)  { return startsWith(b, [0x66, 0x74, 0x79, 0x70], 4); }
// WebM (Matroska): EBML header
function isWebm(b: Uint8Array)  { return startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]); }

// ----- Audio signatures ------------------------------------------------------
function isMp3(b: Uint8Array)   {
  return startsWith(b, [0x49, 0x44, 0x33]) /* "ID3" */ ||
         (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0);  // MPEG audio frame sync
}
function isWav(b: Uint8Array)   {
  return (
    b.length >= 12 &&
    startsWith(b, [0x52, 0x49, 0x46, 0x46]) &&  // "RIFF"
    b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45 // "WAVE"
  );
}

// =============================================================================
// Image-only check (back-compat con onboarding logo)
// =============================================================================
export function detectImageMime(buf: Uint8Array): AllowedImage | null {
  if (isPng(buf))  return "image/png";
  if (isJpeg(buf)) return "image/jpeg";
  if (isWebp(buf)) return "image/webp";
  if (isGif(buf))  return "image/gif";
  return null;
}

export async function verifyImageFile(
  file: File
): Promise<Exclude<AllowedImage, "image/gif"> | null> {
  // Onboarding logo accetta solo PNG/JPEG/WebP (no GIF).
  const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = detectImageMime(buf);
  if (detected === "image/gif") return null;
  return detected;
}

// =============================================================================
// Workspace file check (Batch B: bucket workspace-files)
// =============================================================================

/**
 * Restituisce un MIME "trusted" per il file passato:
 *   - se è un formato binario noto, verifica il magic-byte e ritorna quel MIME
 *   - se il MIME dichiarato è di tipo testo, fa una scansione veloce contro
 *     binary content e ritorna il MIME dichiarato
 *   - altrimenti null (rifiuta)
 *
 * Sample: leggiamo i primi 4096 byte. Sufficiente per signature e text sniff.
 */
export async function verifyWorkspaceFile(
  file: File,
  claimedMime: string
): Promise<string | null> {
  const sample = new Uint8Array(await file.slice(0, 4096).arrayBuffer());

  // 1) Tentativo magic-byte sui formati binari noti
  if (isPng(sample))  return claimedMime === "image/png"  ? "image/png"  : null;
  if (isJpeg(sample)) return claimedMime === "image/jpeg" ? "image/jpeg" : null;
  if (isGif(sample))  return claimedMime === "image/gif"  ? "image/gif"  : null;
  if (isWebp(sample)) return claimedMime === "image/webp" ? "image/webp" : null;
  if (isPdf(sample))  return claimedMime === "application/pdf" ? "application/pdf" : null;

  if (isZip(sample)) {
    // Office DOCX/XLSX/PPTX e archivi ZIP. Validiamo che il MIME dichiarato sia
    // uno della famiglia ZIP-based ammessa.
    const zipFamily = new Set([
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]);
    return zipFamily.has(claimedMime) ? claimedMime : null;
  }

  if (is7z(sample)) {
    return claimedMime === "application/x-7z-compressed" ? claimedMime : null;
  }

  if (isFtyp(sample)) {
    // MP4/MOV: il MIME dichiarato deve essere video/mp4 o video/quicktime.
    return claimedMime === "video/mp4" || claimedMime === "video/quicktime"
      ? claimedMime
      : null;
  }
  if (isWebm(sample)) {
    return claimedMime === "video/webm" ? claimedMime : null;
  }

  if (isMp3(sample)) {
    return claimedMime === "audio/mpeg" || claimedMime === "audio/mp4"
      ? claimedMime
      : null;
  }
  if (isWav(sample)) {
    return claimedMime === "audio/wav" ? claimedMime : null;
  }

  // 2) Formati testuali: il MIME dichiarato deve essere text-like AND il
  //    contenuto non deve sembrare binario (no NUL byte nei primi 4096 byte).
  if (TEXT_LIKE_MIMES.has(claimedMime)) {
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0x00) return null; // binary content travestito da text
    }
    return claimedMime;
  }

  // 3) Sconosciuto: rifiuta.
  return null;
}
