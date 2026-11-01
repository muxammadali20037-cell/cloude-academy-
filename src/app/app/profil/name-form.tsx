"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateFullName, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = { status: "idle" };

export function NameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(updateFullName, initialState);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        label="Toʻliq ism"
        hint="Sertifikatda aynan shunday yoziladi"
        error={state.status === "error" ? state.message : undefined}
      >
        <Input name="fullName" defaultValue={defaultName} autoComplete="name" placeholder="Masalan, Dilnoza Karimova" maxLength={120} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          Saqlash
        </Button>
        {state.status === "saved" && (
          <p role="status" className="text-sm text-success">
            Saqlandi
          </p>
        )}
      </div>
    </form>
  );
}
