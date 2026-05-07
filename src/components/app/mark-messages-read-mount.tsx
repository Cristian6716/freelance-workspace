"use client";

import { useEffect, useRef } from "react";

import { markMessagesReadAction } from "@/actions/messages";

/**
 * Marca i messaggi del cliente come letti al mount della tab. Best-effort,
 * niente UI: l'errore viene loggato server-side.
 */
export function MarkMessagesReadMount({ workspaceId }: { workspaceId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void markMessagesReadAction(workspaceId);
  }, [workspaceId]);
  return null;
}
