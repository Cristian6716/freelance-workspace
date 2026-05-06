import type { Metadata } from "next";
import Link from "next/link";

import { signinWithGoogleAction } from "@/actions/auth";
import { GoogleButton } from "@/components/app/google-button";
import { SigninForm } from "@/components/app/signin-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Accedi",
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next;
  const oauthError = params.error;

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <h1 className="font-heading text-h2 text-foreground">Bentornato</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accedi al tuo workspace [NOME_APP].
        </p>
      </div>

      {oauthError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          Login con Google fallito. Riprova o usa email e password.
        </p>
      ) : null}

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-h3">Accedi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <SigninForm next={next} />

          <div className="relative">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            <span className="relative mx-auto block w-fit bg-card px-3 text-xs uppercase tracking-widest text-muted-foreground">
              oppure
            </span>
          </div>

          <GoogleButton next={next} label="Continua con Google" action={signinWithGoogleAction} />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Non hai ancora un account?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-foreground hover:underline"
        >
          Registrati
        </Link>
      </p>
    </div>
  );
}
