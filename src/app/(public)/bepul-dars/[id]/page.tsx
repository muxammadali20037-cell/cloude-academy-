import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonAside } from "@/components/learning/lesson-aside";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { getLessonForVisitor } from "@/lib/data/learning";
import { getIntegrationStatuses } from "@/lib/integrations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bepul dars" };

/** Akkauntsiz ko'rish: faqat nashr qilingan bepul darslar. Progress saqlanmaydi. */
export default async function FreeLessonPage({ params }: PageProps<"/bepul-dars/[id]">) {
  const { id } = await params;
  const result = await getLessonForVisitor(id);
  if (result.status !== "ok" || !result.data.isFreePreview || result.data.access !== "open") notFound();

  const lesson = result.data;
  const videoConfigured = getIntegrationStatuses().find((item) => item.id === "video")?.configured ?? false;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 max-w-[65ch]">
        <p className="text-sm text-fg-muted">
          <Link href="/bepul-dars" className="underline-offset-4 hover:text-fg hover:underline">
            Bepul dars
          </Link>
          , {lesson.levelNumber}-daraja
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{lesson.title}</h1>
        {lesson.summary && <p className="mt-2 text-fg-muted">{lesson.summary}</p>}
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <LessonPlayer lesson={lesson} mode="visitor" initialProgress={null} videoConfigured={videoConfigured} />
        <LessonAside lesson={lesson} />
      </div>
    </main>
  );
}
