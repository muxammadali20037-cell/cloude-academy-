"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestEmailCode, type AuthFormState } from "../actions";

const initialState: AuthFormState = { status: "idle" };

export function EmailLoginForm({ next, disabled }: { next: string; disabled: boolean }) {
  const [state, formAction, pending] = useActionState(requestEmailCode, initialState);
  const fieldError = state.status === "error" && state.field === "email" ? state.message : undefined;
  const formError = state.status === "error" && !state.field ? state.message : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label="Email" error={fieldError}>
        <Input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ism@misol.uz"
          required
          disabled={disabled}
        />
      </Field>
      {formError && (
        <p role="alert" className="rounded-control bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>
        Kod olish
      </Button>
    </form>
  );
}
