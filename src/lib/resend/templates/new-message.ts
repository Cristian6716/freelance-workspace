import "server-only";

import {
  ctaButton,
  escapeHtml,
  renderEmailShell,
  type Branding,
  type RenderedEmail,
} from "@/lib/resend/templates/base";

/**
 * Notifica "Nuovo messaggio" — usata in 2 direzioni:
 * - cliente → freelance: il freelance riceve l'email
 * - freelance → cliente: il cliente riceve l'email
 *
 * Il template è simmetrico: cambiano solo i nomi e l'URL di destinazione.
 */
export function newMessageEmail(args: {
  branding: Branding;
  /** Chi ha scritto il messaggio (mostrato in oggetto + body). */
  senderName: string;
  /** Workspace di provenienza. */
  workspaceName: string;
  /** Anteprima messaggio (max ~280 caratteri, troncata). */
  messagePreview: string;
  /** URL diretta alla chat. */
  conversationUrl: string;
}): RenderedEmail {
  const subject = `Nuovo messaggio da ${args.senderName} in ${args.workspaceName}`;
  const preheader = args.messagePreview.slice(0, 140);

  const truncated =
    args.messagePreview.length > 280
      ? `${args.messagePreview.slice(0, 280).trimEnd()}…`
      : args.messagePreview;

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      Hai un nuovo messaggio da <strong>${escapeHtml(args.senderName)}</strong> nel workspace
      <strong>${escapeHtml(args.workspaceName)}</strong>.
    </p>
    <blockquote style="margin:16px 0;padding:16px;background:#f7f2f8;border-left:3px solid #c9c5d0;border-radius:4px;color:#1c1b1f;font-size:15px;line-height:1.6;white-space:pre-wrap;">
      ${escapeHtml(truncated)}
    </blockquote>
    ${ctaButton({ url: args.conversationUrl, label: "Apri conversazione", brandColor: args.branding.brandColor })}
    <p style="margin:24px 0 0;color:#5f5c73;font-size:13px;">
      Rispondi direttamente nel workspace.
    </p>
  `;

  const bodyText = `Hai un nuovo messaggio da ${args.senderName} nel workspace "${args.workspaceName}":

> ${truncated}

Apri conversazione: ${args.conversationUrl}`;

  return renderEmailShell({ branding: args.branding, subject, preheader, bodyHtml, bodyText });
}
