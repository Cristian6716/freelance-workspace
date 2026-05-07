import Link from "next/link";

import { clientLogoutAction } from "@/actions/client-magic-link";
import { Button } from "@/components/ui/button";
import type { Branding } from "@/lib/resend/templates/base";
import { initialsFor } from "@/lib/utils";

type Props = {
  branding: Branding;
  memberEmail: string | null;
  unreadCount: number;
};

const NAV_LINKS = [
  { href: "/client", label: "Panoramica" },
  { href: "/client/projects", label: "Progetti" },
  { href: "/client/files", label: "File" },
  { href: "/client/messages", label: "Messaggi" },
  { href: "/client/invoices", label: "Fatture" },
] as const;

export function ClientTopbar({ branding, memberEmail, unreadCount }: Props) {
  const accent = isValidHex(branding.brandColor) ? branding.brandColor : "#1b1345";

  return (
    <header className="w-full border-b border-outline-variant/30 bg-surface-container-lowest">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-4">
        <div className="flex items-center gap-3">
          {branding.freelanceLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo profilo, già hostato su Supabase Storage signed URL
            <img
              src={branding.freelanceLogoUrl}
              alt={branding.freelanceName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-outline-variant/40 object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
              aria-hidden="true"
            >
              {initialsFor(branding.freelanceName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading text-base font-medium text-foreground leading-tight">
              {branding.freelanceName}
            </p>
            <p className="text-xs text-on-surface-variant">Workspace condiviso</p>
          </div>
        </div>

        <nav
          aria-label="Sezioni workspace cliente"
          className="-mx-2 overflow-x-auto px-2"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  label={link.label}
                  accent={accent}
                  badgeCount={link.href === "/client/messages" ? unreadCount : 0}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden truncate text-sm text-on-surface-variant sm:block max-w-[200px]">
            {memberEmail}
          </span>
          <form action={clientLogoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Esci
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  accent,
  badgeCount,
}: {
  href: string;
  label: string;
  accent: string;
  badgeCount: number;
}) {
  // Active styling delegato al CSS (focus/hover) — la "active" route si calcola
  // lato client component perché serve usePathname; per ora decoriamo solo focus.
  return (
    <Link
      href={href}
      className="relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      style={{ ["--accent" as string]: accent }}
    >
      {label}
      {badgeCount > 0 && (
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
          style={{ backgroundColor: accent }}
          aria-label={`${badgeCount} non letti`}
        >
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

function isValidHex(value: string | null): value is string {
  return value !== null && /^#[0-9A-Fa-f]{6}$/.test(value);
}
