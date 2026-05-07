import "server-only";

import {
  ctaButton,
  escapeHtml,
  renderEmailShell,
  type Branding,
  type RenderedEmail,
} from "@/lib/resend/templates/base";

/**
 * Notifica al freelance: il cliente ha approvato una milestone consegnata.
 */
export function milestoneApprovedEmail(args: {
  branding: Branding;
  clientName: string;
  workspaceName: string;
  projectTitle: string;
  milestoneTitle: string;
  /** Importo formato italiano già pronto, es. "€ 800,00". null se non valorizzato. */
  amountFormatted: string | null;
  workspaceUrl: string;
}): RenderedEmail {
  const subject = `${args.clientName} ha approvato "${args.milestoneTitle}"`;
  const preheader = `Milestone approvata in ${args.projectTitle}.`;

  const amountRow = args.amountFormatted
    ? `<tr><td style="padding:8px 0;color:#5f5c73;">Importo</td><td style="padding:8px 0;text-align:right;font-variant-numeric:tabular-nums;font-weight:500;">${escapeHtml(args.amountFormatted)}</td></tr>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 16px;">Buone notizie: il cliente ha approvato una consegna.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e6e1e6;border-bottom:1px solid #e6e1e6;font-size:15px;">
      <tr><td style="padding:8px 0;color:#5f5c73;">Workspace</td><td style="padding:8px 0;text-align:right;font-weight:500;">${escapeHtml(args.workspaceName)}</td></tr>
      <tr><td style="padding:8px 0;color:#5f5c73;">Progetto</td><td style="padding:8px 0;text-align:right;font-weight:500;">${escapeHtml(args.projectTitle)}</td></tr>
      <tr><td style="padding:8px 0;color:#5f5c73;">Milestone</td><td style="padding:8px 0;text-align:right;font-weight:500;">${escapeHtml(args.milestoneTitle)}</td></tr>
      ${amountRow}
    </table>
    <p style="margin:0 0 16px;">Puoi procedere con la fatturazione quando preferisci.</p>
    ${ctaButton({ url: args.workspaceUrl, label: "Apri workspace", brandColor: args.branding.brandColor })}
  `;

  const bodyText = `Il cliente ${args.clientName} ha approvato la milestone "${args.milestoneTitle}" del progetto "${args.projectTitle}" (${args.workspaceName}).${args.amountFormatted ? `\nImporto: ${args.amountFormatted}` : ""}

Apri workspace: ${args.workspaceUrl}`;

  return renderEmailShell({ branding: args.branding, subject, preheader, bodyHtml, bodyText });
}
