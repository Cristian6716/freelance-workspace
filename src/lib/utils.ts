import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// String / display helpers
// =============================================================================

/**
 * Estrae le iniziali da un nome o email.
 * "Mario Rossi" → "MR", "marco@x.it" → "MA", "" → "??"
 */
export function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  if (!source) return "??";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return parts[0]!.slice(0, 2).toUpperCase();
}

/**
 * Hash deterministico stringa → uno tra N indici palette.
 * Usato per assegnare un colore avatar consistente per workspace.
 */
function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 8 sfumature M3 expressive armoniche con la palette base.
const AVATAR_PALETTE = [
  { bg: "#e5dffb", fg: "#1b1345" }, // lavender-deep
  { bg: "#ffdad6", fg: "#690005" }, // coral
  { bg: "#dbe8ff", fg: "#0a366d" }, // sky
  { bg: "#dcecdb", fg: "#0c4626" }, // sage
  { bg: "#fde2c2", fg: "#523200" }, // amber
  { bg: "#f9d8e9", fg: "#601d44" }, // pink
  { bg: "#d8e6e7", fg: "#0a3a3f" }, // teal
  { bg: "#e0deff", fg: "#1f1d4f" }, // periwinkle
] as const;

export function avatarColorFor(seed: string): { bg: string; fg: string } {
  if (!seed) return AVATAR_PALETTE[0]!;
  const idx = hashString(seed) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx]!;
}

// =============================================================================
// Currency / date formatting (italiano)
// =============================================================================

export function formatEUR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateIT(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * "2 ore fa", "ieri", "il 12 mar 2026". Usato per "Aggiornato N tempo fa".
 */
export function relativeTimeIT(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "pochi secondi fa";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} or${h === 1 ? "a" : "e"} fa`;
  const day = Math.round(h / 24);
  if (day < 7) return `${day} giorn${day === 1 ? "o" : "i"} fa`;
  return `il ${formatDateIT(d)}`;
}
