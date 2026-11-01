import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  /** Nima qilish kerakligini aytadi — kayfiyat emas, yo'nalish. */
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-10 text-center",
        className,
      )}
    >
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-fg-subtle">
        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
      </span>
      <div className="max-w-sm">
        <p className="font-semibold text-fg">{title}</p>
        <p className="mt-1 text-sm text-fg-muted">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
