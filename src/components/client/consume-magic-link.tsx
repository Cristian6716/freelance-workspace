"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { consumeMagicLinkAction } from "@/actions/client-magic-link";

/**
 * Auto-consuma il magic link al mount: chiama la Server Action, scambia il
 * token con un cookie HttpOnly e redirect a `/client`. Su errore, redirect
 * a `/client/expired?reason=...`.
 *
 * Strict-mode/double-invocation safety: usa un ref per garantire una sola
 * chiamata anche con React.StrictMode (development double-mount).
 */
export function ConsumeMagicLink({ token }: { token: string }) {
  const router = useRouter();
  const fired = useRef(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setStuck(true);
    }, 4000);

    consumeMagicLinkAction(token)
      .then((result) => {
        if (cancelled) return;
        clearTimeout(slowTimer);
        if (result.ok) {
          router.replace("/client");
          router.refresh();
        } else {
          router.replace(`/client/expired?reason=${result.reason}`);
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(slowTimer);
        router.replace("/client/expired?reason=invalid");
      });

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [token, router]);

  return (
    <div className="grid place-items-center min-h-[60dvh] gap-4 text-center">
      <Loader2Icon className="h-8 w-8 animate-spin text-on-surface-variant" aria-hidden="true" />
      <div>
        <p className="font-heading text-h3 text-foreground">Apertura del workspace…</p>
        {stuck && (
          <p className="mt-2 max-w-md text-sm text-on-surface-variant">
            Sta impiegando più del previsto. Se non si carica entro qualche secondo,
            ricarica la pagina.
          </p>
        )}
      </div>
    </div>
  );
}
