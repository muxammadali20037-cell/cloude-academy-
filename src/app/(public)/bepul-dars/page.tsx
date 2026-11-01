import { CircleDashed, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/learning/empty-state";
import { Button } from "@/components/ui/button";
import { getPublicCurriculum } from "@/lib/data/curriculum";
import { freePreviewLessons } from "@/lib/data/curriculum-shape";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bepul dars" };

export default async function FreeLessonsPage() {
  const result = await getPublicCurriculum();
  const lessons = result.status === "ok" ? freePreviewLessons(result.data) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Bepul dars</h1>
        <p className="mt-4 text-lg text-fg-muted">
          Akkauntsiz ochiladi. Natijangizni saqlash uchun roʻyxatdan oʻting.
        </p>
      </header>

      {lessons.length > 0 ? (
        <ul className="divide-y divide-line rounded-panel border border-line">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link href={`/bepul-dars/${lesson.id}`} className="flex items-center gap-4 p-5 transition-colors hover:bg-surface">
                <PlayCircle aria-hidden className="size-6 shrink-0 text-accent-fg" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{lesson.title}</span>
                  <span className="block text-sm text-fg-muted">
                    {lesson.levelNumber}-daraja, {lesson.moduleTitle}
                    {lesson.estimatedMinutes ? `, ${lesson.estimatedMinutes} daqiqa` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={CircleDashed}
          title="Bepul dars tayyorlanmoqda"
          description="Birinchi bepul dars yozilib, tekshirilgach shu yerda ochiladi. Hozircha saytdagi namuna mashqni sinab koʻring."
          action={
            <Button asChild variant="outline">
              <Link href="/">Namuna mashqqa oʻtish</Link>
            </Button>
          }
        />
      )}
    </main>
  );
}
