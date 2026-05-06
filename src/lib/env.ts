/**
 * Environment variables validation.
 * Fails fast at boot if required variables are missing or malformed.
 * NEVER export `serverEnv` from a "use client" file or import it from a client component:
 * Next.js inlines its values into the client bundle if you do.
 */

import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_FEATURE_GOOGLE_AUTH: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const serverEnvSchema = z.object({
  SUPABASE_PROJECT_REF: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 chars (use openssl rand -base64 32)"),
  RESEND_API_KEY: z.string().optional().default(""),
  RESEND_FROM_EMAIL: z.string().optional().default(""),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  PYVA_MOCK: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  PYVA_API_BASE_URL: z.string().optional().default(""),
  PYVA_WEBHOOK_SECRET: z.string().optional().default(""),
  SENTRY_DSN: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function parseClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_FEATURE_GOOGLE_AUTH: process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid client environment variables:\n${issues}\nCheck .env.local against .env.example.`
    );
  }
  return parsed.data;
}

function parseServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error(
      "serverEnv accessed on the client. Move the import to a server-only file."
    );
  }

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    PYVA_MOCK: process.env.PYVA_MOCK,
    PYVA_API_BASE_URL: process.env.PYVA_API_BASE_URL,
    PYVA_WEBHOOK_SECRET: process.env.PYVA_WEBHOOK_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment variables:\n${issues}\nCheck .env.local against .env.example.`
    );
  }
  return parsed.data;
}

export const clientEnv = parseClientEnv();

let _serverEnv: ReturnType<typeof parseServerEnv> | null = null;

/**
 * Returns server-only env vars. Lazy-evaluated to avoid running on client.
 * Use only inside Server Components, Server Actions, Route Handlers, or middleware.
 */
export function serverEnv() {
  if (!_serverEnv) _serverEnv = parseServerEnv();
  return _serverEnv;
}
