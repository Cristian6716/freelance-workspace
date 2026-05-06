"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "Tutti" },
  { key: "active", label: "Attivi" },
  { key: "archived", label: "Archiviati" },
] as const;

export type DashboardFilterKey = (typeof FILTERS)[number]["key"];

export function DashboardFilterPills({
  current,
  counts,
}: {
  current: DashboardFilterKey;
  counts: Record<DashboardFilterKey, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const onClick = (key: DashboardFilterKey) => {
    const next = new URLSearchParams(params.toString());
    if (key === "all") next.delete("filter");
    else next.set("filter", key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra workspace">
      {FILTERS.map((f) => {
        const active = current === f.key;
        return (
          <button
            key={f.key}
            role="tab"
            aria-selected={active}
            onClick={() => onClick(f.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-foreground"
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                active
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-foreground/10 text-on-surface-variant"
              )}
            >
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
