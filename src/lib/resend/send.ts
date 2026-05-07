import "server-only";

import { serverEnv } from "@/lib/env";
import { getResend } from "@/lib/resend/client";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /**
   * Tag opzionale per segmentazione log/Resend dashboard.
   * Es. "client_invite", "new_message", "milestone_approved".
   */
  tag?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: "no_api_key" | "no_from_email" | "send_failed"; message?: string };

/**
 * Wrapper unico per invio email transazionali via Resend.
 * - Se RESEND_API_KEY o RESEND_FROM_EMAIL mancano, ritorna { ok: false } senza throw.
 *   In dev questo permette di lavorare senza key configurata.
 * - Mai loggare body/recipient in chiaro (PII): logga solo subject/tag/error code.
 * - Non re-trya: i fallimenti sono surfaced al chiamante che decide UX.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = serverEnv();
  const resend = getResend();

  if (!resend) {
    console.warn("[resend/send] missing RESEND_API_KEY — email skipped:", input.tag ?? input.subject);
    return { ok: false, reason: "no_api_key" };
  }
  if (!env.RESEND_FROM_EMAIL) {
    console.warn("[resend/send] missing RESEND_FROM_EMAIL — email skipped");
    return { ok: false, reason: "no_from_email" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo ?? env.RESEND_REPLY_TO ?? undefined,
      tags: input.tag ? [{ name: "kind", value: input.tag }] : undefined,
    });
    if (error) {
      console.error("[resend/send] api error:", error.name, error.message, "tag:", input.tag);
      return { ok: false, reason: "send_failed", message: error.message };
    }
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[resend/send] unexpected:", message, "tag:", input.tag);
    return { ok: false, reason: "send_failed", message };
  }
}
