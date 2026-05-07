import "server-only";

import {
  ctaButton,
  escapeHtml,
  renderEmailShell,
  type Branding,
  type RenderedEmail,
} from "@/lib/resend/templates/base";

/**
 * Email "Invito al workspace" inviata al cliente quando il freelance preme
 * "Invia invito" dal workspace settings.
 */
export function clientInviteEmail(args: {
  branding: Branding;
  workspaceName: string;
  inviteUrl: string;
  /** Email del cliente, usata per "Ciao {nomeCliente o email}". */
  clientEmail: string;
  /** Optional: nome cliente se valorizzato in workspace data. */
  clientName?: string | null;
}): RenderedEmail {
  const greetingName =
    args.clientName?.trim() || args.clientEmail.split("@")[0] || args.clientEmail;
  const subject = `${args.branding.freelanceName} ti ha invitato nel workspace`;
  const preheader = `Apri il tuo workspace per ${args.workspaceName}: progetti, file e messaggi in un unico posto.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Ciao ${escapeHtml(greetingName)},</p>
    <p style="margin:0 0 16px;">
      <strong>${escapeHtml(args.branding.freelanceName)}</strong> ti ha invitato nel workspace condiviso
      <strong>${escapeHtml(args.workspaceName)}</strong>: qui troverai i progetti in corso, i file consegnati,
      le fatture e potrai scambiare messaggi direttamente.
    </p>
    <p style="margin:0 0 8px;">Accedi senza creare un account: il link è personale, conservalo.</p>
    ${ctaButton({ url: args.inviteUrl, label: "Apri il workspace", brandColor: args.branding.brandColor })}
    <p style="margin:0 0 8px;color:#5f5c73;font-size:13px;">
      Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
      <a href="${escapeHtml(args.inviteUrl)}" style="color:#5f5c73;word-break:break-all;">${escapeHtml(args.inviteUrl)}</a>
    </p>
    <p style="margin:24px 0 0;color:#5f5c73;font-size:13px;">
      Il link è valido 90 giorni. Se non riconosci questo invito ignora pure questa email.
    </p>
  `;

  const bodyText = `Ciao ${greetingName},

${args.branding.freelanceName} ti ha invitato nel workspace condiviso "${args.workspaceName}":
qui troverai progetti, file, fatture e potrai scambiare messaggi.

Apri il workspace: ${args.inviteUrl}

Il link è valido 90 giorni. Se non riconosci questo invito, ignora pure questa email.`;

  return renderEmailShell({ branding: args.branding, subject, preheader, bodyHtml, bodyText });
}
