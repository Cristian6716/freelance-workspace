"use client";

import {
  Building2,
  Calculator,
  Camera,
  Code,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  completeStep1Action,
  type OnboardingActionResult,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  VERTICAL_LABELS,
  VERTICAL_SUBTITLES,
  type Vertical,
} from "@/lib/validation/schemas";

const ORDER: Vertical[] = [
  "web_dev",
  "architect",
  "photographer",
  "accountant",
  "smm",
];

const ICONS: Record<Vertical, LucideIcon> = {
  web_dev: Code,
  architect: Building2,
  photographer: Camera,
  accountant: Calculator,
  smm: Megaphone,
};

function ContinueButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="min-w-[200px]" disabled={disabled || pending}>
      {pending ? "Avanti…" : "Continua"}
    </Button>
  );
}

export function OnboardingStep1({
  templateCounts,
}: {
  templateCounts: Record<Vertical, number>;
}) {
  const [state, formAction] = useActionState<OnboardingActionResult | null, FormData>(
    completeStep1Action,
    null
  );
  const [selected, setSelected] = useState<Vertical | "">("");
  const formError = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} className="contents">
      <main className="flex-grow pt-24 pb-40 px-gutter flex flex-col items-center w-full max-w-[1280px] mx-auto">
        <section className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
            Benvenuto in [NOME_APP]
          </p>
          <h1 className="font-heading text-h1 text-foreground mb-4">
            Cosa fai nella vita?
          </h1>
          <p className="text-body-lg leading-relaxed text-secondary">
            Personalizzeremo il tuo workspace, i template di progetto e le
            categorie in base alla tua professione.
          </p>
        </section>

        <section className="w-full max-w-5xl mx-auto">
          <input type="hidden" name="vertical" value={selected} />
          <div
            role="radiogroup"
            aria-label="Scegli la tua professione"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6"
          >
            {ORDER.map((v) => {
              const Icon = ICONS[v];
              const isSelected = selected === v;
              const count = templateCounts[v] ?? 0;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(v)}
                  className={cn(
                    "group flex flex-col h-full text-left p-6 rounded-2xl shadow-level-2",
                    "bg-surface-container-lowest border-2 transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isSelected
                      ? "border-primary"
                      : "border-transparent hover:border-outline-variant"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="h-6 w-6 text-primary-container" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {VERTICAL_LABELS[v]}
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    {VERTICAL_SUBTITLES[v]}
                  </p>
                  <p className="mt-auto text-[11px] uppercase tracking-widest font-semibold text-on-surface-variant">
                    Template inclusi: {count}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <a
              href="mailto:hello@example.com?subject=La%20mia%20professione%20non%20%C3%A8%20qui"
              className="text-sm text-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              La mia professione non è qui
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {formError ? (
            <p
              role="alert"
              className="mt-6 text-center text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur z-40">
        <div className="flex flex-col items-center py-8 px-gutter max-w-[1280px] mx-auto gap-3">
          <ContinueButton disabled={!selected} />
          <p className="text-xs text-secondary text-center">
            Potrai modificare i template e le impostazioni in qualunque momento.
          </p>
        </div>
      </footer>
    </form>
  );
}
