"use client";

import { useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  completeStep2Action,
  type OnboardingActionResult,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="min-w-[180px]" disabled={pending}>
      {pending ? "Salvataggio…" : "Continua"}
    </Button>
  );
}

export function OnboardingStep2() {
  const [state, formAction] = useActionState<OnboardingActionResult | null, FormData>(
    completeStep2Action,
    null
  );
  const fullNameId = useId();
  const vatId = useId();
  const fiscalRegimeId = useId();
  const ibanId = useId();
  const logoId = useId();
  const [regimeValue, setRegimeValue] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const formError = state && !state.ok ? state.error : null;

  return (
    <form
      action={formAction}
      className="w-full max-w-xl mx-auto px-gutter pt-24 pb-12 grid gap-6"
      noValidate
    >
      <div className="text-center mb-2">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
          Passo 2 di 2
        </p>
        <h1 className="font-heading text-h2 text-foreground mb-2">
          Raccontaci di te
        </h1>
        <p className="text-body-md text-secondary">
          Servono per fatture e profilo cliente. Restano sempre modificabili.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fullNameId}>Nome e cognome</Label>
        <Input
          id={fullNameId}
          name="full_name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          autoCapitalize="words"
          aria-invalid={!!fieldErrors.full_name?.length || undefined}
          aria-describedby={fieldErrors.full_name?.length ? `${fullNameId}-err` : undefined}
        />
        {fieldErrors.full_name?.length ? (
          <p id={`${fullNameId}-err`} className="text-sm text-destructive">
            {fieldErrors.full_name[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={vatId}>Partita IVA</Label>
        <Input
          id={vatId}
          name="vat_number"
          required
          inputMode="numeric"
          pattern="[0-9]{11}"
          maxLength={11}
          autoComplete="off"
          placeholder="01234567890"
          aria-invalid={!!fieldErrors.vat_number?.length || undefined}
          aria-describedby={`${vatId}-hint ${fieldErrors.vat_number?.length ? `${vatId}-err` : ""}`.trim()}
        />
        <p id={`${vatId}-hint`} className="text-xs text-muted-foreground">
          11 cifre. Verifichiamo automaticamente il checksum.
        </p>
        {fieldErrors.vat_number?.length ? (
          <p id={`${vatId}-err`} className="text-sm text-destructive">
            {fieldErrors.vat_number[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fiscalRegimeId}>Regime fiscale</Label>
        <Select
          name="fiscal_regime"
          value={regimeValue}
          onValueChange={(v) => setRegimeValue(v ?? "")}
        >
          <SelectTrigger id={fiscalRegimeId} aria-invalid={!!fieldErrors.fiscal_regime?.length || undefined}>
            <SelectValue placeholder="Seleziona…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="forfettario">Forfettario</SelectItem>
            <SelectItem value="ordinario">Ordinario</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.fiscal_regime?.length ? (
          <p className="text-sm text-destructive">{fieldErrors.fiscal_regime[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={ibanId}>
          IBAN <span className="text-muted-foreground">· opzionale</span>
        </Label>
        <Input
          id={ibanId}
          name="iban"
          autoComplete="off"
          inputMode="text"
          placeholder="IT00 X000 0000 0000 0000 0000 000"
          maxLength={32}
          className="uppercase tracking-wider"
          aria-invalid={!!fieldErrors.iban?.length || undefined}
          aria-describedby={`${ibanId}-hint ${fieldErrors.iban?.length ? `${ibanId}-err` : ""}`.trim()}
        />
        <p id={`${ibanId}-hint`} className="text-xs text-muted-foreground">
          Lo mostreremo ai clienti quando configureranno il bonifico.
        </p>
        {fieldErrors.iban?.length ? (
          <p id={`${ibanId}-err`} className="text-sm text-destructive">
            {fieldErrors.iban[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={logoId}>
          Logo <span className="text-muted-foreground">· opzionale</span>
        </Label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview locale, no remote
              <img
                src={logoPreview}
                alt="Anteprima logo caricato"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Nessuno</span>
            )}
          </div>
          <div className="grid gap-1">
            <Input
              ref={fileInputRef}
              id={logoId}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setLogoPreview(null);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setLogoPreview(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
            <p className="text-xs text-muted-foreground">PNG, JPEG o WebP. Massimo 2 MB.</p>
            {fieldErrors.logo?.length ? (
              <p className="text-sm text-destructive">{fieldErrors.logo[0]}</p>
            ) : null}
          </div>
        </div>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
