import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

/**
 * Vaqtinchalik bosh sahifa. To'liq landing 3-fazada quriladi.
 * Bu yerda soxta statistika yoki sharh yo'q.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <Wordmark size={32} />
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-fg sm:text-5xl">
          Platforma qurilmoqda
        </h1>
        <p className="max-w-[55ch] text-lg text-fg-muted">
          {brand.tagline} Kurs, toʻlov va shaxsiy kabinet keyingi bosqichlarda ishga tushadi.
        </p>
      </div>
      <div>
        <Button asChild variant="outline">
          <Link href="/design-system">Dizayn tizimini koʻrish</Link>
        </Button>
      </div>
      <p className="text-sm text-fg-subtle">{brand.disclaimer}</p>
    </main>
  );
}
