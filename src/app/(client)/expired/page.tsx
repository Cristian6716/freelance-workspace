import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Link non valido",
  robots: { index: false, follow: false },
};

const REASON_COPY: Record<string, { title: string; body: string }> = {
  expired: {
    title: "Il tuo link è scaduto",
    body: "Per sicurezza l'accesso scade dopo 90 giorni di inattività. Chiedi al tuo freelance di rigenerarti il link.",
  },
  invalid: {
    title: "Link non valido",
    body: "Il link che hai aperto non è riconosciuto. Potrebbe essere stato copiato male o revocato.",
  },
  revoked: {
    title: "Accesso revocato",
    body: "Il freelance ha revocato il tuo accesso a questo workspace. Contattalo per riprovare.",
  },
  no_session: {
    title: "Apri prima il link via email",
    body: "Per accedere al tuo workspace clicca il link che ti è stato inviato via email. Se non lo trovi, chiedi al freelance di rinviarlo.",
  },
  wrong_workspace: {
    title: "Accesso non consentito",
    body: "La sessione non è abilitata per questo workspace. Apri di nuovo il link che hai ricevuto via email.",
  },
};

export default async function ClientExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const copy = REASON_COPY[reason ?? "invalid"] ?? REASON_COPY.invalid!;

  return (
    <div className="grid place-items-center min-h-[60dvh] px-4 py-8">
      <div className="grid w-full max-w-md gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm">
        <h1 className="font-heading text-h2 text-foreground">{copy.title}</h1>
        <p className="text-on-surface-variant">{copy.body}</p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Hai bisogno di un nuovo link? Scrivi un&apos;email al tuo freelance: visualizzerà
          la richiesta e potrà rigenerartelo in pochi secondi.
        </p>
        <div className="mt-2">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
