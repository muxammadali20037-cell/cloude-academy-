"use client";

import { Check, X } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export type ChoiceResult = "correct" | "incorrect" | "neutral";

export type ChoiceOptionProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  "children"
> & {
  /** Variant belgisi: A, B, C... */
  marker: string;
  children: React.ReactNode;
  /**
   * Tekshiruvdan keyingi holat: to'g'ri javob, talabaning xato tanlovi
   * yoki tanlanmagan boshqa variant.
   */
  result?: ChoiceResult;
};

/** Test mashqidagi bitta variant. ChoiceGroup ichida ishlatiladi. */
export function ChoiceOption({ marker, children, result, className, ...props }: ChoiceOptionProps) {
  const graded = result !== undefined;
  return (
    <RadioGroupPrimitive.Item
      data-result={result}
      className={cn(
        "group flex w-full items-start gap-3 rounded-control border border-line bg-canvas p-3.5 text-left text-[0.9375rem] text-fg transition-colors",
        "hover:border-line-strong data-[state=checked]:border-primary data-[state=checked]:bg-accent-soft",
        "disabled:cursor-default",
        result === "correct" && "border-success bg-success-soft data-[state=checked]:border-success data-[state=checked]:bg-success-soft",
        result === "incorrect" && "border-danger bg-danger-soft data-[state=checked]:border-danger data-[state=checked]:bg-danger-soft",
        result === "neutral" && "opacity-70 hover:border-line",
        className,
      )}
      disabled={graded || props.disabled}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-xs font-semibold text-fg-muted",
          "group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-on-primary",
          result === "correct" && "border-success bg-success text-canvas group-data-[state=checked]:border-success group-data-[state=checked]:bg-success group-data-[state=checked]:text-canvas",
          result === "incorrect" && "border-danger bg-danger text-canvas group-data-[state=checked]:border-danger group-data-[state=checked]:bg-danger group-data-[state=checked]:text-canvas",
        )}
      >
        {result === "correct" ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : result === "incorrect" ? (
          <X className="size-3.5" strokeWidth={3} />
        ) : (
          marker
        )}
      </span>
      <span className="min-w-0 flex-1 pt-0.5 leading-snug">{children}</span>
      {result === "correct" && <span className="sr-only">Toʻgʻri javob</span>}
      {result === "incorrect" && <span className="sr-only">Siz tanlagan, notoʻgʻri</span>}
    </RadioGroupPrimitive.Item>
  );
}

export function ChoiceGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2.5", className)} {...props} />;
}
