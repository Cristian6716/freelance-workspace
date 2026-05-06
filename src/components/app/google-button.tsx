"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.4-4.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.8 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5c-7.3 0-13.6 4.1-16.8 10.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.4 0 10.3-2 14-5.3l-6.5-5.5c-1.9 1.4-4.3 2.3-7.5 2.3-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9 41.6 16 45.5 24 45.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.7 5l6.5 5.5C42 36 44.5 30.6 44.5 25c0-1.5-.2-3-.9-4.5z"
      />
    </svg>
  );
}

function SubmitInner({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full justify-center gap-3"
      disabled={pending}
    >
      <GoogleIcon className="h-5 w-5 shrink-0" />
      <span>{pending ? "Apertura Google…" : children}</span>
    </Button>
  );
}

/**
 * Pulsante "Continua con Google".
 * Renderizza un placeholder disabilitato se la feature è OFF; altrimenti
 * un form che chiama signinWithGoogleAction.
 */
export function GoogleButton({
  next,
  label,
  action,
}: {
  next?: string;
  label: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  if (!clientEnv.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-3"
        disabled
        aria-disabled
        title="Disponibile a breve"
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        <span>{label} · Disponibile a breve</span>
      </Button>
    );
  }

  return (
    <form action={action}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <SubmitInner>{label}</SubmitInner>
    </form>
  );
}
