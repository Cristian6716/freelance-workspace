"use client";

import { useEffect } from "react";

import { touchClientLastSeenAction } from "@/actions/client-mutations";

/**
 * Aggiorna `workspace_members.last_seen_at` ad ogni mount del layout cliente.
 * Best-effort: errori loggati lato server, ignorati lato UI.
 *
 * Throttling: massimo una touch ogni 5 minuti per non spammare il DB. Lo
 * stato è in sessionStorage (sopravvive al refresh, non al close-tab).
 */
export function TouchLastSeen() {
  useEffect(() => {
    const KEY = "nome_app_last_seen_touch";
    const FIVE_MIN_MS = 5 * 60 * 1000;
    try {
      const last = Number(sessionStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < FIVE_MIN_MS) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      // sessionStorage non disponibile: procedi senza throttle
    }
    void touchClientLastSeenAction();
  }, []);

  return null;
}
