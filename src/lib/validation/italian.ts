/**
 * Validatori specifici per dati italiani (P.IVA, IBAN).
 * Nessuna dipendenza esterna. Lato client e server.
 */

/**
 * Partita IVA italiana: 11 cifre con checksum (algoritmo Luhn-like AdE).
 * Vedi https://www.agenziaentrate.gov.it/portale/web/guest/codici-fiscali-e-partite-iva
 */
export function isValidItalianVAT(input: string): boolean {
  const vat = input.replace(/\s+/g, "");
  if (!/^\d{11}$/.test(vat)) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const ch = vat[i];
    if (!ch) return false;
    const digit = Number(ch);
    if (Number.isNaN(digit)) return false;
    if (i % 2 === 0) {
      // posizione dispari (1°, 3°, 5°...) — index pari
      sum += digit;
    } else {
      // posizione pari (2°, 4°, 6°...) — index dispari, raddoppia, sottrai 9 se > 9
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return sum % 10 === 0;
}

/**
 * IBAN IT: "IT" + 2 cifre check + 1 lettera CIN + 22 cifre = 27 caratteri.
 * Validazione MOD-97 (ISO 13616): deve dare resto 1.
 */
export function isValidItalianIBAN(input: string): boolean {
  const iban = input.replace(/\s+/g, "").toUpperCase();
  if (!/^IT\d{2}[A-Z]\d{22}$/.test(iban)) return false;

  // Sposta i primi 4 caratteri in coda, sostituisci lettere con A=10, B=11, ..., Z=35
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    if (/\d/.test(ch)) {
      numeric += ch;
    } else {
      numeric += (ch.charCodeAt(0) - 55).toString();
    }
  }

  // MOD-97 step-by-step per evitare BigInt overflow
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/**
 * Normalizza una P.IVA per storage: solo cifre, no spazi.
 */
export function normalizeItalianVAT(input: string): string {
  return input.replace(/\s+/g, "");
}

/**
 * Normalizza un IBAN per storage: maiuscolo, no spazi.
 */
export function normalizeIBAN(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
