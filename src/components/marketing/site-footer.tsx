import Link from "next/link";
import { BrandMark } from "@/components/brand/wordmark";
import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 font-semibold text-fg">
            <BrandMark size={22} />
            {brand.name}
          </p>
          <p className="max-w-md text-sm text-fg-muted">{brand.tagline}</p>
          <p className="max-w-md text-sm text-fg-subtle">{brand.disclaimer}</p>
        </div>
        <nav aria-label="Pastki menyu" className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:flex-col">
          <Link href="/dastur" className="text-fg-muted hover:text-fg">
            Kurs dasturi
          </Link>
          <Link href="/narxlar" className="text-fg-muted hover:text-fg">
            Narxlar
          </Link>
          <Link href="/bepul-dars" className="text-fg-muted hover:text-fg">
            Bepul dars
          </Link>
          <Link href="/kirish" className="text-fg-muted hover:text-fg">
            Kirish
          </Link>
        </nav>
      </div>
    </footer>
  );
}
