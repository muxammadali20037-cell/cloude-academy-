import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <Wordmark />
      <h1 className="text-4xl font-semibold tracking-tight text-fg">Sahifa topilmadi</h1>
      <p className="text-lg text-fg-muted">Manzil notoʻgʻri yoki bu sahifa hali mavjud emas.</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Bosh sahifa</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dastur">Kurs dasturi</Link>
        </Button>
      </div>
    </main>
  );
}
