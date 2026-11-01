import type { Metadata } from "next";
import Link from "next/link";
import { CurriculumView, type LessonState } from "@/components/learning/curriculum-view";
import { Button } from "@/components/ui/button";
import { getPublicCurriculum } from "@/lib/data/curriculum";
import type { CurriculumLesson } from "@/lib/data/curriculum-shape";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kurs dasturi",
  description: "Claude Masterclass: 6 daraja — asoslardan AI muhandisligi va real loyihalargacha.",
};

const stateOf = (lesson: CurriculumLesson): LessonState => {
  if (lesson.status !== "published") return "soon";
  return lesson.isFreePreview ? "free" : "locked";
};

export default async function ProgramPage() {
  const result = await getPublicCurriculum();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {result.status === "ok" ? (
        <>
          <header className="mb-10 max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{result.data.title}</h1>
            {result.data.subtitle && <p className="mt-2 text-xl text-fg-muted">{result.data.subtitle}</p>}
            {result.data.description && <p className="mt-4 text-fg-muted">{result.data.description}</p>}
            <p className="mt-4 text-sm tabular-nums text-fg-subtle">
              {result.data.levels.length} ta daraja, {result.data.lessonCount} ta dars. “Tez orada” belgisi — dars
              yozilmoqda va rasmiy hujjatlar bilan tekshirilgach nashr qilinadi.
            </p>
          </header>
          <CurriculumView
            curriculum={result.data}
            stateOf={stateOf}
            hrefOf={(lesson, state) => (state === "free" ? `/bepul-dars/${lesson.id}` : null)}
          />
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/kirish?next=/app">Kursni boshlash</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/narxlar">Narxlar</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-semibold tracking-tight text-fg">Kurs dasturi</h1>
          <p className="mt-4 rounded-panel bg-surface p-6 text-fg-muted">
            Dastur hozircha yuklanmadi. Birozdan keyin sahifani yangilang.
          </p>
        </>
      )}
    </main>
  );
}
