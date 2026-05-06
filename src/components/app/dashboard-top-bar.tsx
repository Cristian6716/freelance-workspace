"use client";

import { useState } from "react";
import {
  BellIcon,
  MenuIcon,
  XIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth";
import { initialsFor } from "@/lib/utils";

type TopBarUser = {
  email: string | null;
  full_name: string | null;
  subscription_tier: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  soon?: boolean;
};

const MOBILE_NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "#", label: "Fatture", icon: FileTextIcon, soon: true },
  { href: "#", label: "Impostazioni", icon: SettingsIcon, soon: true },
  { href: "#", label: "Piano", icon: WalletIcon, soon: true },
];

export function DashboardTopBar({ user }: { user: TopBarUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-sm sm:px-6 lg:pl-6 lg:pr-8">
        <div className="flex items-center gap-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Apri menu"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <span className="font-heading text-h3 font-medium">[NOME_APP]</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifiche"
            className="text-on-surface-variant hover:text-foreground"
          >
            <BellIcon className="h-5 w-5" />
          </Button>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-on-surface-variant hover:text-foreground"
            >
              Esci
            </Button>
          </form>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="font-heading text-h3 font-medium">[NOME_APP]</h2>
                <p className="text-body-sm text-on-surface-variant/80 mt-0.5">
                  Freelance Workspace
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Chiudi menu"
                onClick={() => setMobileOpen(false)}
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3" aria-label="Menu principale (mobile)">
              <ul className="flex flex-col gap-1">
                {MOBILE_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.soon ? "#" : item.href}
                        onClick={(e) => {
                          if (item.soon) e.preventDefault();
                          else setMobileOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-on-surface-variant hover:bg-surface-variant"
                      >
                        <Icon className="h-5 w-5" />
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
            <div className="border-t border-outline-variant/40 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold text-xs">
                  {initialsFor(user.full_name, user.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.full_name ?? user.email}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant capitalize">
                    Piano {user.subscription_tier}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
