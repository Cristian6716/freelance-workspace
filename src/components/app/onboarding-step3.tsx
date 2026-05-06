"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  completeStep3Action,
  skipStep3Action,
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

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Creazione…" : "Crea workspace"}
    </Button>
  );
}

function SkipButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" disabled={pending}>
      {pending ? "Un attimo…" : "Salta, lo faccio dopo"}
    </Button>
  );
}

export function OnboardingStep3() {
  const [state, formAction] = useActionState<OnboardingActionResult | null, FormData>(
    completeStep3Action,
    null
  );
  const clientNameId = useId();
  const clientEmailId = useId();
  const clientTypeId = useId();
  const [clientType, setClientType] = useState<string>("");

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const formError = state && !state.ok ? state.error : null;

  return (
    <div className="w-full max-w-xl mx-auto px-gutter pt-24 pb-12 grid gap-6">
      <div className="text-center mb-2">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
          Passo 3 di 3
        </p>
        <h1 className="font-heading text-h2 text-foreground mb-2">
          Aggiungi il tuo primo cliente
        </h1>
        <p className="text-body-md text-secondary">
          Crea un workspace per iniziare. Potrai invitare il cliente in
          qualunque momento, anche dopo.
        </p>
      </div>

      <form action={formAction} className="grid gap-5" noValidate>
        <div className="grid gap-2">
          <Label htmlFor={clientNameId}>Nome cliente</Label>
          <Input
            id={clientNameId}
            name="client_name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="organization"
            autoCapitalize="words"
            placeholder="Es. Studio Bianchi & Co"
            aria-invalid={!!fieldErrors.client_name?.length || undefined}
            aria-describedby={fieldErrors.client_name?.length ? `${clientNameId}-err` : undefined}
          />
          {fieldErrors.client_name?.length ? (
            <p id={`${clientNameId}-err`} className="text-sm text-destructive">
              {fieldErrors.client_name[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={clientTypeId}>Tipo cliente</Label>
          <Select
            name="client_type"
            value={clientType}
            onValueChange={(v) => setClientType(v ?? "")}
          >
            <SelectTrigger
              id={clientTypeId}
              aria-invalid={!!fieldErrors.client_type?.length || undefined}
            >
              <SelectValue placeholder="Seleziona…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Privato</SelectItem>
              <SelectItem value="company">Azienda</SelectItem>
              <SelectItem value="pa">Pubblica Amministrazione</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.client_type?.length ? (
            <p className="text-sm text-destructive">{fieldErrors.client_type[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={clientEmailId}>
            Email cliente <span className="text-muted-foreground">· opzionale</span>
          </Label>
          <Input
            id={clientEmailId}
            type="email"
            name="client_email"
            inputMode="email"
            autoComplete="email"
            placeholder="cliente@example.com"
            aria-invalid={!!fieldErrors.client_email?.length || undefined}
            aria-describedby={fieldErrors.client_email?.length ? `${clientEmailId}-err` : undefined}
          />
          {fieldErrors.client_email?.length ? (
            <p id={`${clientEmailId}-err`} className="text-sm text-destructive">
              {fieldErrors.client_email[0]}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
          {/* Form separato per lo skip — Server Action senza payload */}
          <div />
          <CreateButton />
        </div>
      </form>

      <form action={skipStep3Action} className="flex justify-center">
        <SkipButton />
      </form>
    </div>
  );
}
