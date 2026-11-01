import type { Metadata } from "next";
import { Pricing } from "@/components/marketing/pricing";
import { getActivePlans } from "@/lib/data/curriculum";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Narxlar" };

export default async function PricingPage() {
  const plans = await getActivePlans();
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Narxlar</h1>
        <p className="mt-4 text-lg text-fg-muted">
          Narxlar, muddatlar va AI mentor limitlari administrator tomonidan belgilanadi va shu yerda koʻrsatiladi.
        </p>
      </header>
      <Pricing plans={plans} />
    </main>
  );
}
