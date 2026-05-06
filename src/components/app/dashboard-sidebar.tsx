"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  FileTextIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";

import { cn, initialsFor } from "@/lib/utils";

type SidebarUser = {
  email: string | null;
  full_name: string | null;
  subscription_tier: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  matchPrefix: string;
  soon?: boolean;
};

const NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, matchPrefix: "/dashboard" },
  { href: "/invoices", label: "Fatture", icon: FileTextIcon, matchPrefix: "/invoices", soon: true },
  { href: "/settings", label: "Impostazioni", icon: SettingsIcon, matchPrefix: "/settings", soon: true },
  { href: "/plan", label: "Piano", icon: WalletIcon, matchPrefix: "/plan", soon: true },
];

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  studio: "Studio",
};

export function DashboardSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground",
        "border-r border-sidebar-border",
        "lg:flex"
      )}
    >
      <div className="px-6 pt-8 pb-6">
        <Link href="/dashboard" className="block">
          <h2 className="font-heading text-h3 font-medium text-foreground">[NOME_APP]</h2>
          <p className="text-body-sm text-on-surface-variant/80 mt-0.5">
            Freelance Workspace
          </p>
        </Link>
      </div>

      <nav className="flex-1 px-3" aria-label="Menu principale">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.matchPrefix !== "/dashboard" && pathname.startsWith(item.matchPrefix));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.soon ? "#" : item.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={item.soon ? "true" : undefined}
                  onClick={item.soon ? (e) => e.preventDefault() : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    "border-l-4 border-transparent",
                    isActive
                      ? "border-primary bg-surface-container text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-variant hover:text-foreground",
                    item.soon && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                      Presto
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-outline-variant/40 px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold text-xs"
            aria-hidden="true"
          >
            {initialsFor(user.full_name, user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.full_name ?? user.email ?? "—"}
            </p>
            <p className="truncate text-xs text-on-surface-variant">
              Piano {TIER_LABEL[user.subscription_tier] ?? user.subscription_tier}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
