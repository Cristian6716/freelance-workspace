import type { Metadata } from "next";
import Link from "next/link";

import { signinWithGoogleAction } from "@/actions/auth";
import { GoogleButton } from "@/components/app/google-button";
import { SignupForm } from "@/components/app/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Crea il tuo account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next;

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <h1 className="font-heading text-h2 text-foreground">
          Inizia gratis con [NOME_APP]
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          14 giorni di Pro inclusi. Nessuna carta richiesta.
        </p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-h3">Crea account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <SignupForm />

          <div className="relative">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            <span className="relative mx-auto block w-fit bg-card px-3 text-xs uppercase tracking-widest text-muted-foreground">
              oppure
            </span>
          </div>

          <GoogleButton next={next} label="Registrati con Google" action={signinWithGoogleAction} />

          <p className="text-xs text-muted-foreground">
            Procedendo accetti i nostri{" "}
            <Link href="/terms" className="underline">
              Termini
            </Link>{" "}
            e la{" "}
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link
          href={next ? `/signin?next=${encodeURIComponent(next)}` : "/signin"}
          className="font-medium text-foreground hover:underline"
        >
          Accedi
        </Link>
      </p>
    </div>
  );
}
