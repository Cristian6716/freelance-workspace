"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import { signupWithEmailAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creazione account…" : children}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    signupWithEmailAction,
    null
  );
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const formError = state && !state.ok ? state.error : null;
  const successMessage = state && state.ok ? state.message : null;

  return (
    <form action={formAction} noValidate className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={!!fieldErrors.email?.length || undefined}
          aria-describedby={fieldErrors.email?.length ? `${emailId}-err` : undefined}
        />
        {fieldErrors.email?.length ? (
          <p id={`${emailId}-err`} className="text-sm text-destructive">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={!!fieldErrors.password?.length || undefined}
          aria-describedby={`${passwordId}-hint ${fieldErrors.password?.length ? `${passwordId}-err` : ""}`.trim()}
        />
        <p id={`${passwordId}-hint`} className="text-xs text-muted-foreground">
          Almeno 8 caratteri, una lettera e un numero.
        </p>
        {fieldErrors.password?.length ? (
          <p id={`${passwordId}-err`} className="text-sm text-destructive">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p
          role="status"
          className="rounded-lg border border-primary-container/30 bg-secondary-container px-3 py-2 text-sm text-on-secondary-container"
        >
          {successMessage}
        </p>
      ) : null}

      <SubmitButton>Crea account</SubmitButton>
    </form>
  );
}
