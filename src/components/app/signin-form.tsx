"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import { signinWithEmailAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Accesso in corso…" : children}
    </Button>
  );
}

export function SigninForm({ next }: { next?: string }) {
  const initial: ActionResult | null = null;
  const [state, formAction] = useActionState(signinWithEmailAction, initial);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const formError = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} noValidate className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
        <div className="flex items-center justify-between">
          <Label htmlFor={passwordId}>Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-secondary hover:text-foreground"
            tabIndex={-1}
          >
            Password dimenticata?
          </Link>
        </div>
        <Input
          id={passwordId}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          aria-invalid={!!fieldErrors.password?.length || undefined}
          aria-describedby={fieldErrors.password?.length ? `${passwordId}-err` : undefined}
        />
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

      <SubmitButton>Accedi</SubmitButton>
    </form>
  );
}
