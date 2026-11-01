"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resendEmailCode, verifyEmailCode, type AuthFormState } from "../actions";

const initialState: AuthFormState = { status: "idle" };

export function VerifyCodeForm() {
  const [state, formAction, pending] = useActionState(verifyEmailCode, initialState);
  const [resendState, resendAction, resending] = useActionState(resendEmailCode, initialState);

  const codeError = state.status === "error" ? state.message : undefined;

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5" noValidate>
        <Field label="Kod" error={codeError}>
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={7}
            placeholder="123456"
            className="h-14 text-center font-mono text-2xl tracking-[0.4em]"
            required
            autoFocus
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Tasdiqlash
        </Button>
      </form>

      <form action={resendAction} className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button type="submit" variant="link" loading={resending}>
          Kodni qayta yuborish
        </Button>
        {resendState.status !== "idle" && (
          <p role="status" className={resendState.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>
            {resendState.message}
          </p>
        )}
      </form>
    </div>
  );
}
