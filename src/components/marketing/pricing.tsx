import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CHECKOUT_READY } from "@/config/features";
import { formatPriceUzs } from "@/lib/data/curriculum-shape";
import type { PublicPlan } from "@/lib/data/curriculum";
import type { DataResult } from "@/lib/data/result";
import { cn } from "@/lib/utils";

function durationLabel(days: number | null) {
  if (days === null) return "Muddatsiz kirish";
  if (days % 365 === 0) return `${days / 365} yil kirish`;
  if (days % 30 === 0) return `${days / 30} oy kirish`;
  return `${days} kun kirish`;
}

/** Tariflar faqat bazadan. Faol tarif bo'lmasa — halol xabar, soxta narx emas. */
export function Pricing({ plans }: { plans: DataResult<PublicPlan[]> }) {
  if (plans.status !== "ok" || plans.data.length === 0) {
    return (
      <div className="rounded-panel border border-line p-6 sm:p-8">
        <p className="text-xl font-semibold tracking-tight text-fg">Narxlar ochilish arafasida eʼlon qilinadi</p>
        <p className="mt-2 max-w-[60ch] text-fg-muted">
          Hozir toʻlov tizimi (Click va Payme) ulanmoqda. Roʻyxatdan oʻtsangiz, bepul darslar va
          dasturni koʻra olasiz, kurs ochilganda kabinetingizda tarif tanlaysiz.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/kirish?next=/app">Roʻyxatdan oʻtish</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bepul-dars">Bepul darsni sinab koʻrish</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {plans.data.map((plan, index) => (
        <li
          key={plan.id}
          className={cn(
            "flex flex-col gap-6 rounded-panel border p-6 sm:p-8",
            index === 0 ? "border-primary/50 bg-accent-soft" : "border-line",
          )}
        >
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-fg">{plan.name}</h3>
            {plan.description && <p className="mt-1 text-fg-muted">{plan.description}</p>}
          </div>
          <div>
            <p className="text-4xl font-semibold tabular-nums tracking-tight text-fg">{formatPriceUzs(plan.priceTiyin)}</p>
            <p className="mt-1 text-sm text-fg-muted">{durationLabel(plan.durationDays)}</p>
          </div>
          <ul className="flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-[0.9375rem] text-fg">
                <Check aria-hidden className="mt-0.5 size-4.5 shrink-0 text-accent-fg" />
                {feature}
              </li>
            ))}
          </ul>
          {CHECKOUT_READY ? (
            <Button asChild size="lg" variant={index === 0 ? "primary" : "outline"}>
              <Link href={`/kirish?next=${encodeURIComponent(`/tolov/${plan.code}`)}`}>{plan.name} tarifini tanlash</Link>
            </Button>
          ) : (
            <div className="space-y-2">
              <Button size="lg" variant={index === 0 ? "primary" : "outline"} className="w-full" disabled>
                Toʻlov tez orada ochiladi
              </Button>
              <p className="text-center text-sm text-fg-subtle">Click va Payme ulanmoqda</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
