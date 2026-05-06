import { z } from "zod";

import { isValidItalianIBAN, isValidItalianVAT } from "./italian";

// =============================================================================
// Verticali professionali
// =============================================================================
export const verticalEnum = z.enum([
  "web_dev",
  "architect",
  "photographer",
  "accountant",
  "smm",
]);
export type Vertical = z.infer<typeof verticalEnum>;

export const VERTICAL_LABELS: Record<Vertical, string> = {
  web_dev: "Web & Design",
  architect: "Architettura & Ingegneria",
  photographer: "Foto & Video",
  accountant: "Consulenza fiscale",
  smm: "Marketing & Social",
};

export const VERTICAL_SUBTITLES: Record<Vertical, string> = {
  web_dev: "Sviluppatori, Designer, Agenzie",
  architect: "Architetti, Geometri, Ingegneri",
  photographer: "Fotografi, Videomaker, Wedding",
  accountant: "Commercialisti, Consulenti, Studi",
  smm: "SMM, Marketer, Creator",
};

// =============================================================================
// Auth
// =============================================================================
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email richiesta")
  .email("Indirizzo email non valido")
  .max(254, "Email troppo lunga");

export const passwordSchema = z
  .string()
  .min(8, "Almeno 8 caratteri")
  .max(128, "Massimo 128 caratteri");

// Politica password rafforzata: almeno 1 lettera + 1 numero. Niente "max complessità eccessiva"
// (NIST 800-63B: lunghezza > complessità).
export const strongPasswordSchema = passwordSchema
  .refine((v) => /[A-Za-z]/.test(v), "Deve contenere almeno una lettera")
  .refine((v) => /[0-9]/.test(v), "Deve contenere almeno un numero");

export const signupSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SigninInput = z.infer<typeof signinSchema>;

// =============================================================================
// Onboarding
// =============================================================================
export const onboardingStep1Schema = z.object({
  vertical: verticalEnum,
});
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;

export const fiscalRegimeEnum = z.enum(["forfettario", "ordinario"]);

export const onboardingStep2Schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Inserisci nome e cognome (min. 2 caratteri)")
    .max(100, "Massimo 100 caratteri"),
  vat_number: z
    .string()
    .trim()
    .refine(isValidItalianVAT, "Partita IVA non valida"),
  fiscal_regime: fiscalRegimeEnum,
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => v.length === 0 || isValidItalianIBAN(v),
      "IBAN non valido"
    )
    .optional()
    .default(""),
});
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;

export const clientTypeEnum = z.enum(["private", "company", "pa"]);

export const onboardingStep3Schema = z.object({
  client_name: z
    .string()
    .trim()
    .min(2, "Inserisci il nome del cliente")
    .max(120, "Massimo 120 caratteri"),
  client_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email non valida")
    .max(254)
    .optional()
    .or(z.literal("")),
  client_type: clientTypeEnum,
});
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;

// =============================================================================
// File upload (logo profilo)
// =============================================================================
export const ALLOWED_LOGO_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export const logoUploadSchema = z.object({
  size: z.number().max(MAX_LOGO_BYTES, "Massimo 2 MB"),
  type: z.enum(ALLOWED_LOGO_MIME, {
    error: "Formato non supportato. Usa PNG, JPEG o WebP.",
  }),
});
