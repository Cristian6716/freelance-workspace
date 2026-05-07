import "server-only";

import {
  ctaButton,
  escapeHtml,
  renderEmailShell,
  type Branding,
  type RenderedEmail,
} from "@/lib/resend/templates/base";

/**
 * Notifica al freelance: il cliente ha richiesto modifiche su una milestone
 * consegnata. Include il commento del cliente.
 */
export function milestoneRevisionEmail(args: {
  branding: Branding;
  clientName: string;
  workspaceName: string;
  projectTitle: string;
  milestoneTitle: string;
  /** Commento del cliente, già trimmato. */
  comment: string;
  workspaceUrl: string;
}): RenderedEmail {
  const subject = `Richiesta di modifiche su "${args.milestoneTitle}"`;
  const preheader = `${args.clientName} ha lasciato un commento su ${args.projectTitle}.`;

  const truncated =
    args.comment.length > 600 ? `${args.comment.slice(0, 600).trimEnd()}…` : args.comment;

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      Il cliente <strong>${escapeHtml(args.clientName)}</strong> ha richiesto modifiche
      sulla milestone <strong>${escapeHtml(args.milestoneTitle)}</strong> del progetto
      <strong>${escapeHtml(args.projectTitle)}</strong>.
    </p>
    <blockquote style="margin:16px 0;padding:16px;background:#f7f2f8;border-left:3px solid #c9c5d0;border-radius:4px;font-size:15px;line-height:1.6;white-space:pre-wrap;">
      ${escapeHtml(truncated)}
    </blockquote>
    <p style="margin:0 0 16px;color:#5f5c73;">
      Lo stesso commento è stato pubblicato come messaggio nel workspace.
    </p>
    ${ctaButton({ url: args.workspaceUrl, label: "Apri workspace", brandColor: args.branding.brandColor })}
  `;

  const bodyText = `Il cliente ${args.clientName} ha richiesto modifiche su "${args.milestoneTitle}" (${args.projectTitle}, ${args.workspaceName}).

Commento:
> ${truncated}

Lo stesso commento è stato pubblicato nel workspace.

Apri workspace: ${args.workspaceUrl}`;

  return renderEmailShell({ branding: args.branding, subject, preheader, bodyHtml, bodyText });
}
