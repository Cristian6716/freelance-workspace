"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { verifyImageFile } from "@/lib/validation/file-magic";
import {
  ALLOWED_LOGO_MIME,
  MAX_LOGO_BYTES,
  onboardingStep1Schema,
  onboardingStep2Schema,
} from "@/lib/validation/schemas";
import { normalizeIBAN, normalizeItalianVAT } from "@/lib/validation/italian";

export type OnboardingActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

const GENERIC_ERROR = "Impossibile salvare. Riprova fra qualche istante.";

function zodToFieldErrors<T>(err: z.ZodError<T>): Partial<Record<string, string[]>> {
  return z.flattenError(err).fieldErrors as Partial<Record<string, string[]>>;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  return { supabase, user };
}

// =============================================================================
// Step 1 — Verticale professionale
// =============================================================================
export async function completeStep1Action(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  const parsed = onboardingStep1Schema.safeParse({
    vertical: formData.get("vertical"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Seleziona una professione.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ vertical: parsed.data.vertical })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding/step1] update profile failed:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/onboarding");
  redirect("/onboarding");
}

// =============================================================================
// Step 2 — Dati profilo (full_name, P.IVA, regime, IBAN, logo)
// Al successo redirige a /dashboard. La creazione del primo workspace è
// stata rimossa dall'onboarding (l'utente la fa dal dialog dashboard in Batch B).
// =============================================================================
export async function completeStep2Action(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  const parsed = onboardingStep2Schema.safeParse({
    full_name: formData.get("full_name"),
    vat_number: formData.get("vat_number"),
    fiscal_regime: formData.get("fiscal_regime"),
    iban: formData.get("iban") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();

  // Logo opzionale
  let logo_url: string | undefined;
  const logoEntry = formData.get("logo");
  if (logoEntry instanceof File && logoEntry.size > 0) {
    if (logoEntry.size > MAX_LOGO_BYTES) {
      return {
        ok: false,
        error: "Logo troppo grande (max 2 MB).",
        fieldErrors: { logo: ["Massimo 2 MB"] },
      };
    }
    if (!ALLOWED_LOGO_MIME.includes(logoEntry.type as (typeof ALLOWED_LOGO_MIME)[number])) {
      return {
        ok: false,
        error: "Formato logo non supportato (PNG, JPEG o WebP).",
        fieldErrors: { logo: ["Formato non supportato"] },
      };
    }
    // Magic-byte check: il MIME header può essere falsato.
    const detected = await verifyImageFile(logoEntry);
    if (!detected) {
      return {
        ok: false,
        error: "Il file caricato non è un'immagine valida.",
        fieldErrors: { logo: ["File non riconosciuto"] },
      };
    }

    const ext = detected === "image/jpeg" ? "jpg" : detected === "image/png" ? "png" : "webp";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-logos")
      .upload(path, logoEntry, {
        contentType: detected,
        upsert: false,
      });
    if (uploadError) {
      console.error("[onboarding/step2] logo upload failed:", uploadError.message);
      return { ok: false, error: GENERIC_ERROR };
    }
    logo_url = path; // path relativo al bucket; la signed URL è generata on-demand
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      vat_number: normalizeItalianVAT(parsed.data.vat_number),
      fiscal_regime: parsed.data.fiscal_regime,
      iban: parsed.data.iban ? normalizeIBAN(parsed.data.iban) : null,
      ...(logo_url ? { logo_url } : {}),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding/step2] update profile failed:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/onboarding");
  redirect("/dashboard");
}
