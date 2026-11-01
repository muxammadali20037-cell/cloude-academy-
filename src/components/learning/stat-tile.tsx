import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTileProps = {
  label: string;
  /** Faqat bazadan kelgan haqiqiy qiymat. Yangi talabada 0 bo'lishi normal. */
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
};

export function StatTile({ label, value, unit, hint, icon: Icon, className }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-card bg-surface p-4", className)}>
      <p className="flex items-center gap-1.5 text-sm text-fg-muted">
        {Icon && <Icon aria-hidden className="size-4 text-fg-subtle" strokeWidth={1.75} />}
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-fg">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-fg-muted">{unit}</span>}
      </p>
      {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
