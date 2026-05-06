"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Tab = {
  key: string;
  label: string;
  href: (id: string) => string;
  soon?: boolean;
};

const TABS: readonly Tab[] = [
  { key: "projects", label: "Progetti", href: (id) => `/workspace/${id}` },
  { key: "files", label: "File", href: (id) => `/workspace/${id}/files` },
  { key: "messages", label: "Messaggi", href: (id) => `/workspace/${id}/messages` },
  { key: "invoices", label: "Fatture", href: (id) => `/workspace/${id}/invoices`, soon: true },
  { key: "settings", label: "Impostazioni", href: (id) => `/workspace/${id}/settings`, soon: true },
];

export function WorkspaceTabs({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Sezioni workspace"
      className="flex flex-wrap gap-1 border-b border-border"
    >
      {TABS.map((tab) => {
        const target = tab.href(workspaceId);
        const isProjectsTab = tab.key === "projects";
        const isActive = isProjectsTab
          ? pathname === target || pathname.startsWith(`/workspace/${workspaceId}/projects`)
          : pathname === target || pathname.startsWith(`${target}/`);
        const disabled = tab.soon === true;

        return (
          <Link
            key={tab.key}
            href={disabled ? "#" : target}
            role="tab"
            aria-selected={isActive}
            aria-disabled={disabled || undefined}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              "border-b-2",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-on-surface-variant hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {tab.label}
            {disabled && (
              <span className="rounded-full bg-surface-variant px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Presto
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
