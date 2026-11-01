import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { LessonPath } from "@/components/learning/lesson-path";
import { brand } from "@/config/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Link href="/" className="self-start rounded-control" aria-label={`${brand.name} bosh sahifasi`}>
          <Wordmark />
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</main>
        <p className="text-xs text-fg-subtle">{brand.disclaimer}</p>
      </div>

      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col lg:justify-end"
      >
        <div className="dark max-w-md space-y-8">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Har bir darsda koʻrasiz, bajarasiz va xatongiz nima uchunligini tushunasiz.
          </p>
          <LessonPath currentIndex={4} />
        </div>
      </aside>
    </div>
  );
}
