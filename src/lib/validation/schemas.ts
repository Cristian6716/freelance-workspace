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

// `clientTypeEnum` resta esportato — sarà riusato dal dialog "+ Nuovo workspace"
// del Batch B che ha più campi (telefono, P.IVA cliente, SDI, indirizzo).
export const clientTypeEnum = z.enum(["private", "company", "pa"]);

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

// =============================================================================
// Batch B — Workspace cliente
// =============================================================================

export const VAT_FORMAT_RE = /^[A-Z0-9]{8,16}$/;
const SDI_FORMAT_RE = /^[A-Z0-9]{6,7}$/; // codice destinatario SDI 6-7 char
const PEC_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalString = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const workspaceAddressSchema = z
  .object({
    street: optionalString(120, "Via troppo lunga"),
    city: optionalString(80, "Città troppo lunga"),
    cap: z
      .string()
      .trim()
      .regex(/^[0-9]{5}$/, "CAP non valido (5 cifre)")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    province: optionalString(2, "Sigla provincia (2 lettere)"),
    country: optionalString(60, "Paese troppo lungo"),
  })
  .partial();

export type WorkspaceAddress = z.infer<typeof workspaceAddressSchema>;

// Shape base senza refinements: usata per sia create (con superRefine) che update (partial).
const workspaceBaseShape = {
  client_name: z
    .string()
    .trim()
    .min(2, "Nome cliente richiesto (min. 2 caratteri)")
    .max(120, "Massimo 120 caratteri"),
  client_type: clientTypeEnum,
  client_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email non valida")
    .max(254, "Email troppo lunga")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  client_phone: optionalString(40, "Telefono troppo lungo"),
  client_vat: z
    .string()
    .trim()
    .toUpperCase()
    .regex(VAT_FORMAT_RE, "P.IVA non valida (8-16 caratteri alfanumerici)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  client_sdi_code: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .refine(
      (v) => v === undefined || SDI_FORMAT_RE.test(v) || PEC_RE.test(v.toLowerCase()),
      "Codice destinatario SDI (6-7 caratteri) o PEC"
    ),
  address: workspaceAddressSchema.optional(),
} as const;

export const workspaceCreateSchema = z
  .object(workspaceBaseShape)
  .superRefine((data, ctx) => {
    // Per company/PA la P.IVA è obbligatoria
    if ((data.client_type === "company" || data.client_type === "pa") && !data.client_vat) {
      ctx.addIssue({
        code: "custom",
        path: ["client_vat"],
        message: "P.IVA obbligatoria per Aziende e PA",
      });
    }
  });
export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>;

export const workspaceUpdateSchema = z
  .object(workspaceBaseShape)
  .partial()
  .extend({
    status: z.enum(["active", "archived"]).optional(),
  });
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;

export const CLIENT_TYPE_LABELS: Record<z.infer<typeof clientTypeEnum>, string> = {
  private: "Privato",
  company: "Azienda",
  pa: "PA",
};

// =============================================================================
// Batch B — Progetti
// =============================================================================

export const projectTypeEnum = z.enum(["deliverable", "recurring"]);
export const projectStatusEnum = z.enum(["draft", "active", "completed", "archived"]);
export const recurringPeriodEnum = z.enum(["monthly", "quarterly"]);

export const PROJECT_STATUS_LABELS: Record<z.infer<typeof projectStatusEnum>, string> = {
  draft: "Bozza",
  active: "Attivo",
  completed: "Completato",
  archived: "Archiviato",
};

export const PROJECT_TYPE_LABELS: Record<z.infer<typeof projectTypeEnum>, string> = {
  deliverable: "A consegne",
  recurring: "Ricorrente",
};

const moneyAmountSchema = z
  .union([z.string().trim(), z.number()])
  .transform((v) => {
    if (typeof v === "number") return v;
    if (v === "") return null;
    // accetta sia "1.234,56" che "1234.56"
    const normalized = v.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Importo non valido")
  .nullable();

export const projectCreateSchema = z
  .object({
    workspace_id: z.uuid(),
    title: z
      .string()
      .trim()
      .min(2, "Titolo richiesto (min. 2 caratteri)")
      .max(200, "Massimo 200 caratteri"),
    description: optionalString(2000, "Descrizione troppo lunga"),
    type: projectTypeEnum,
    status: projectStatusEnum.optional().default("active"),
    start_date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    end_date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    total_amount: moneyAmountSchema.optional(),
    recurring_period: recurringPeriodEnum.optional(),
    recurring_amount: moneyAmountSchema.optional(),
    template_id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.type === "recurring") {
      if (!data.recurring_period) {
        ctx.addIssue({
          code: "custom",
          path: ["recurring_period"],
          message: "Periodicità obbligatoria per servizi ricorrenti",
        });
      }
    }
    if (data.type === "deliverable" && data.recurring_period) {
      ctx.addIssue({
        code: "custom",
        path: ["recurring_period"],
        message: "Periodicità ammessa solo per servizi ricorrenti",
      });
    }
    if (data.start_date && data.end_date && data.start_date > data.end_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "La data di fine deve essere uguale o successiva a quella di inizio",
      });
    }
  });
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2).max(200).optional(),
  description: optionalString(2000, "Descrizione troppo lunga"),
  status: projectStatusEnum.optional(),
  start_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida").optional(),
  end_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida").optional(),
  total_amount: moneyAmountSchema.optional(),
  recurring_amount: moneyAmountSchema.optional(),
});
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

// =============================================================================
// Batch B — Milestone
// =============================================================================

export const milestoneStatusEnum = z.enum(["todo", "in_progress", "delivered", "approved"]);
export type MilestoneStatus = z.infer<typeof milestoneStatusEnum>;

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  todo: "Da fare",
  in_progress: "In corso",
  delivered: "Consegnata",
  approved: "Approvata",
};

export const milestoneCreateSchema = z.object({
  project_id: z.uuid(),
  title: z.string().trim().min(2, "Titolo richiesto").max(200, "Massimo 200 caratteri"),
  description: optionalString(2000, "Descrizione troppo lunga"),
  due_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  amount: moneyAmountSchema.optional(),
  notes_internal: optionalString(2000, "Note troppo lunghe"),
});
export type MilestoneCreateInput = z.infer<typeof milestoneCreateSchema>;

export const milestoneUpdateStatusSchema = z.object({
  id: z.uuid(),
  status: milestoneStatusEnum,
});
export type MilestoneUpdateStatusInput = z.infer<typeof milestoneUpdateStatusSchema>;

export const milestoneReorderSchema = z.object({
  project_id: z.uuid(),
  ordered_ids: z.array(z.uuid()).min(1).max(100),
});
export type MilestoneReorderInput = z.infer<typeof milestoneReorderSchema>;

// =============================================================================
// Batch B — File
// =============================================================================

export const fileVisibilityEnum = z.enum(["private", "shared"]);
export const MAX_WORKSPACE_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

export const fileUploadMetaSchema = z.object({
  workspace_id: z.uuid(),
  project_id: z.uuid().nullable().optional(),
  visibility: fileVisibilityEnum.default("private"),
  filename: z
    .string()
    .trim()
    .min(1, "Nome file richiesto")
    .max(255, "Nome file troppo lungo")
    .refine((v) => !/[\\/]/.test(v), "Caratteri / e \\ non ammessi nel nome file"),
});
export type FileUploadMetaInput = z.infer<typeof fileUploadMetaSchema>;

// =============================================================================
// Batch B — Messaggi
// =============================================================================

export const messageCreateSchema = z.object({
  workspace_id: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Messaggio vuoto")
    .max(8000, "Massimo 8000 caratteri"),
  project_id: z.uuid().nullable().optional(),
  milestone_id: z.uuid().nullable().optional(),
});
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;

// =============================================================================
// Batch C — Vista cliente: invito, magic link, mutazioni cliente
// =============================================================================

export const clientInviteSendSchema = z.object({
  workspace_id: z.uuid(),
  /** True per ruotare l'invite_token e invalidare la sessione cliente esistente. */
  rotate_token: z.boolean().optional().default(false),
});
export type ClientInviteSendInput = z.infer<typeof clientInviteSendSchema>;

export const clientInviteConsumeSchema = z.object({
  token: z.uuid("Token non valido"),
});

export const clientMessageCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Messaggio vuoto")
    .max(8000, "Massimo 8000 caratteri"),
  project_id: z.uuid().nullable().optional(),
});
export type ClientMessageCreateInput = z.infer<typeof clientMessageCreateSchema>;

export const milestoneRevisionRequestSchema = z.object({
  milestone_id: z.uuid(),
  comment: z
    .string()
    .trim()
    .min(1, "Inserisci un commento per il freelance")
    .max(2000, "Massimo 2000 caratteri"),
});
export type MilestoneRevisionRequestInput = z.infer<typeof milestoneRevisionRequestSchema>;

export const milestoneClientApproveSchema = z.object({
  milestone_id: z.uuid(),
});

export const milestoneClientUndoSchema = z.object({
  milestone_id: z.uuid(),
});

export const clientFileSignedUrlSchema = z.object({
  file_id: z.uuid(),
});
