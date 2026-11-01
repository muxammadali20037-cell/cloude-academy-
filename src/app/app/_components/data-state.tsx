import { CloudOff, PlugZap } from "lucide-react";
import { EmptyState } from "@/components/learning/empty-state";

/** Ma'lumot olinmagan holatlar uchun halol xabar (soxta raqam o'rniga). */
export function DataUnavailable({ status }: { status: "not_configured" | "unavailable" | "not_found" }) {
  if (status === "not_configured") {
    return (
      <EmptyState
        icon={PlugZap}
        title="Baza hali ulanmagan"
        description="Supabase sozlamalari kiritilmagan (NOT CONFIGURED). Administrator ularni kiritgach, maʼlumotlar shu yerda koʻrinadi."
      />
    );
  }
  if (status === "not_found") {
    return (
      <EmptyState
        icon={CloudOff}
        title="Kurs topilmadi"
        description="Kurs dasturi hali bazaga kiritilmagan. Administrator dasturni qoʻshgach, shu yerda koʻrinadi."
      />
    );
  }
  return (
    <EmptyState
      icon={CloudOff}
      title="Maʼlumotni yuklab boʻlmadi"
      description="Server bilan aloqa uzildi. Sahifani bir necha soniyadan keyin yangilang."
    />
  );
}
