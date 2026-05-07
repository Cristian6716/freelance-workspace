import "server-only";

import { Resend } from "resend";

import { serverEnv } from "@/lib/env";

let _client: Resend | null = null;

/**
 * Resend client singleton. Inizializzato lazy per non boomare il boot in
 * ambienti dev privi di RESEND_API_KEY (la chiave è opzionale lato env per
 * permettere lo start; se manca, sendEmail logga e ritorna `{ ok: false }`).
 */
export function getResend(): Resend | null {
  const apiKey = serverEnv().RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_client) {
    _client = new Resend(apiKey);
  }
  return _client;
}
