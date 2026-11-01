"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { clamp, cn } from "@/lib/utils";

export type ProgressProps = Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "value"> & {
  /** 0–100. Chegaradan tashqari qiymatlar avtomatik cheklanadi. */
  value: number;
  /** Ekran o'quvchi uchun nom, masalan "Modul progressi". */
  label: string;
};

export function Progress({ className, value, label, ...props }: ProgressProps) {
  const safe = clamp(value, 0, 100);
  return (
    <ProgressPrimitive.Root
      value={safe}
      max={100}
      aria-label={label}
      getValueLabel={(v) => `${Math.round(v)}%`}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-(--ease-out-quint)"
        style={{ width: `${safe}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
