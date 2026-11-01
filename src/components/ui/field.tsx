"use client";

import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

export type FieldProps = {
  label: string;
  /** Qo'shimcha izoh: nima kiritish kerakligi. */
  hint?: string;
  /** Xato matni: nima noto'g'ri va qanday tuzatish. */
  error?: string;
  /** Majburiy maydon belgisi (ekranda ko'rinadi, o'quvchi dastur uchun ham). */
  required?: boolean;
  className?: string;
  /** Bitta boshqaruv elementi: Input, Textarea va h.k. */
  children: React.ReactElement<ControlProps>;
};

/**
 * Label, izoh va xato matnini boshqaruv elementiga to'g'ri bog'laydi
 * (id, aria-describedby, aria-invalid) — ekran o'quvchilar uchun.
 */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const autoId = useId();
  const controlId = children.props.id ?? `field-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy =
    [children.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={controlId}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> (majburiy)</span>}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-sm text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
