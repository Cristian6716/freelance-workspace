"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { signinSchema, signupSchema } from "@/lib/validation/schemas";

export type ActionResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

const GENERIC_ERROR =
  "Impossibile completare la richiesta. Riprova fra qualche istante.";

/**
 * Estrae fieldErrors da un ZodError in formato consumabile da react-hook-form / form UI.
 */
function zodToFieldErrors<T>(err: z.ZodError<T>): Partial<Record<string, string[]>> {
  return z.flattenError(err).fieldErrors as Partial<Record<string, string[]>>;
}

/**
 * Sanifica il valore del param "next" prima di redirigere: deve essere un path
 * interno (no protocol, no // double-slash, no ../).
 */
function safeNextPath(input: FormDataEntryValue | null): string {
  const raw = typeof input === "string" ? input : "";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.includes("..")) return "/dashboard";
  return raw;
}

// =============================================================================
// Signup email/password
// =============================================================================
export async function signupWithEmailAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Per evitare email-enumeration esponiamo un messaggio generico anche se
    // l'errore è "User already registered". Il caso reale di email duplicata
    // viene gestito dal flusso "Hai già un account? Accedi".
    return { ok: false, error: GENERIC_ERROR };
  }

  // Se Supabase ha email confirmation ON, non c'è ancora una sessione.
  // L'utente deve cliccare il link nell'email.
  if (!data.session) {
    return {
      ok: true,
      message:
        "Ti abbiamo inviato un'email di conferma. Clicca il link per attivare l'account.",
    };
  }

  redirect("/onboarding");
}

// =============================================================================
// Signin email/password
// =============================================================================
export async function signinWithEmailAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: "Email o password non corretti." };
  }

  redirect(next);
}

// =============================================================================
// Google OAuth — il pulsante è dietro feature flag (vedi clientEnv).
// L'action è già pronta: quando il flag passa a true, funziona senza modifiche
// purché le credenziali siano configurate in Supabase Auth dashboard.
// =============================================================================
export async function signinWithGoogleAction(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();

  const reqHeaders = await headers();
  const origin =
    reqHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data?.url) {
    redirect(`/signin?error=${encodeURIComponent("Impossibile avviare login Google")}`);
  }

  redirect(data.url);
}

// =============================================================================
// Logout
// =============================================================================
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
