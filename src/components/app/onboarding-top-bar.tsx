import { signOutAction } from "@/actions/auth";

const STEP_TITLES: Record<1 | 2, string> = {
  1: "Scegli il tuo profilo",
  2: "I tuoi dati fiscali",
};

export function OnboardingTopBar({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-background/90 backdrop-blur z-50">
      <div className="flex items-center justify-between h-16 px-gutter max-w-[1280px] mx-auto">
        <span className="font-heading text-h3 text-foreground">[NOME_APP]</span>

        <div className="hidden md:flex flex-col items-center justify-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
            {STEP_TITLES[currentStep]}
          </span>
          <ol className="flex items-center gap-2" aria-label={`Passo ${currentStep} di 2`}>
            {[1, 2].map((step) => (
              <li
                key={step}
                aria-current={step === currentStep ? "step" : undefined}
                className={`h-2 w-2 rounded-full transition-colors ${
                  step <= currentStep ? "bg-primary" : "bg-surface-variant"
                }`}
              />
            ))}
          </ol>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-secondary hover:text-foreground transition-colors"
          >
            Esci
          </button>
        </form>
      </div>
    </header>
  );
}
