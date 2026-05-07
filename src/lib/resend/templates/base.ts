import "server-only";

/**
 * Template base per email transazionali brandizzate col profilo del freelance.
 * HTML inline minimal (table layout, niente flex/grid) per max compatibilità
 * con i client email (Outlook, Gmail, Apple Mail).
 *
 * Branding "leggero" Batch C: logo + brand_color del freelance.
 * Footer "Workspace gestito con [NOME_APP]" nascosto per tier=studio.
 */

export type Branding = {
  freelanceName: string;
  freelanceLogoUrl: string | null;
  brandColor: string | null;
  /** True se il freelance è tier studio (white-label completo). */
  isStudioTier: boolean;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

const APP_NAME = "[NOME_APP]";
const DEFAULT_BRAND = "#1b1345"; // primary-container Material You della palette
const TEXT_COLOR = "#1c1b1f";
const MUTED_COLOR = "#5f5c73";
const BG_COLOR = "#FAF7F2";
const SURFACE_COLOR = "#ffffff";
const BORDER_COLOR = "#e6e1e6";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidHexColor(value: string | null): value is string {
  return value !== null && /^#[0-9A-Fa-f]{6}$/.test(value);
}

/**
 * Wrappa il body con header (logo+nome) + footer condizionale.
 * Usa SOLO inline styles e table layout per compat client email.
 */
export function renderEmailShell(args: {
  branding: Branding;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
  subject: string;
}): RenderedEmail {
  const accent = isValidHexColor(args.branding.brandColor)
    ? args.branding.brandColor
    : DEFAULT_BRAND;
  const safeName = escapeHtml(args.branding.freelanceName);
  const logoBlock = args.branding.freelanceLogoUrl
    ? `<img src="${escapeHtml(args.branding.freelanceLogoUrl)}" alt="${safeName}" width="48" height="48" style="display:block;border-radius:9999px;object-fit:cover;border:1px solid ${BORDER_COLOR};" />`
    : `<div style="width:48px;height:48px;border-radius:9999px;background:${accent};color:#ffffff;text-align:center;line-height:48px;font-family:Inter,Arial,sans-serif;font-weight:600;font-size:18px;">${escapeHtml(args.branding.freelanceName.slice(0, 1).toUpperCase())}</div>`;

  const footerHtml = args.branding.isStudioTier
    ? ""
    : `<tr><td style="padding:24px 32px;background:${BG_COLOR};color:${MUTED_COLOR};font-family:Inter,Arial,sans-serif;font-size:12px;text-align:center;">
         Workspace gestito con ${APP_NAME}
       </td></tr>`;
  const footerText = args.branding.isStudioTier ? "" : `\n\n— Workspace gestito con ${APP_NAME}`;

  const html = `<!doctype html>
<html lang="it"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(args.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG_COLOR};color:${TEXT_COLOR};font-family:Inter,Arial,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(args.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${SURFACE_COLOR};border-radius:16px;border:1px solid ${BORDER_COLOR};overflow:hidden;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">${logoBlock}</td>
              <td style="vertical-align:middle;">
                <div style="font-family:Newsreader,Georgia,serif;font-size:18px;font-weight:500;color:${TEXT_COLOR};line-height:1.2;">${safeName}</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px;color:${TEXT_COLOR};font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;">
          ${args.bodyHtml}
        </td></tr>
        ${footerHtml}
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${args.branding.freelanceName}\n\n${args.bodyText}${footerText}`;

  return { subject: args.subject, html, text };
}

export function ctaButton(args: { url: string; label: string; brandColor: string | null }): string {
  const accent = isValidHexColor(args.brandColor) ? args.brandColor : DEFAULT_BRAND;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${accent};border-radius:8px;">
      <a href="${escapeHtml(args.url)}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:500;">${escapeHtml(args.label)}</a>
    </td></tr></table>`;
}

export { escapeHtml, APP_NAME };
