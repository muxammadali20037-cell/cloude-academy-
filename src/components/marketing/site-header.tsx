import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

const LINKS = [
  { href: "/dastur", label: "Dastur" },
  { href: "/narxlar", label: "Narxlar" },
  { href: "/bepul-dars", label: "Bepul dars" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="rounded-control" aria-label={`${brand.name} bosh sahifasi`}>
          <Wordmark />
        </Link>
        <nav aria-label="Sayt boʻlimlari" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-control px-3 py-2 text-[0.9375rem] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" variant="outline">
          <Link href="/kirish">Kirish</Link>
        </Button>
      </div>
      <nav aria-label="Sayt boʻlimlari (mobil)" className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
