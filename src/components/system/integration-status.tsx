import { CircleCheck, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type IntegrationStatusRowProps = {
  name: string;
  purpose: string;
  configured: boolean;
  phase?: number;
  provider?: string;
  /** Yetishmayotgan o'zgaruvchi nomlari (qiymatlar emas). */
  missing?: string[];
  className?: string;
};

/** Tashqi servis holati: CONFIGURED yoki NOT CONFIGURED. */
export function IntegrationStatusRow({
  name,
  purpose,
  configured,
  phase,
  provider,
  missing = [],
  className,
}: IntegrationStatusRowProps) {
  return (
    <div className={cn("flex flex-col gap-2 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6", className)}>
      <div className="min-w-0">
        <p className="font-medium text-fg">
          {name}
          {provider && <span className="ml-1.5 text-sm font-normal text-fg-subtle">({provider})</span>}
        </p>
        <p className="text-sm text-fg-muted">
          {purpose}
          {phase !== undefined && <span className="text-fg-subtle"> — {phase}-fazada kerak</span>}
        </p>
        {!configured && missing.length > 0 && (
          <p className="mt-1.5 break-words font-mono text-xs text-fg-subtle">
            Kiritilmagan: {missing.join(", ")}
          </p>
        )}
      </div>
      <IntegrationBadge configured={configured} />
    </div>
  );
}

export function IntegrationBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <Badge variant="success" className="self-start">
      <CircleCheck aria-hidden />
      CONFIGURED
    </Badge>
  ) : (
    <Badge variant="warning" className="self-start">
      <PlugZap aria-hidden />
      NOT CONFIGURED
    </Badge>
  );
}
