import { CircleDashed, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/learning/empty-state";
import { LessonAside } from "@/components/learning/lesson-aside";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { getNarrationForLesson } from "@/lib/narration/registry";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getLessonForStudent, getMyLessonProgress } from "@/lib/data/learning";
import { getIntegrationStatuses } from "@/lib/integrations";
import { DataUnavailable } from "../../_components/data-state";
import { completeLessonAction, goToStepAction, recordLearningTimeAction, startLessonAction } from "./actions";

export const metadata: Metadata = { title: "Dars" };

const actions = {
  start: startLessonAction,
  goToStep: goToStepAction,
  complete: completeLessonAction,
  recordTime: recordLearningTimeAction,
};

export default async function LessonPage({ params }: PageProps<"/app/dars/[id]">) {
  const { id } = await params;
  await requireUser(`/app/dars/${id}`);
  const [result, progress] = await Promise.all([getLessonForStudent(id), getMyLessonProgress(id)]);

  if (result.status !== "ok") return <DataUnavailable status={result.status} />;
  const lesson = result.data;
  const videoConfigured = getIntegrationStatuses().find((item) => item.id === "video")?.configured ?? false;

  return (
    <article className="space-y-6">
      <header className="max-w-[65ch]">
        <p className="text-sm text-fg-muted">
          <Link href="/app/kurs" className="underline-offset-4 hover:text-fg hover:underline">
            {lesson.levelNumber}-daraja
          </Link>
          , {lesson.moduleTitle}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{lesson.title}</h1>
        {lesson.summary && <p className="mt-2 text-fg-muted">{lesson.summary}</p>}
      </header>

      {lesson.access === "planned" && (
        <EmptyState
          icon={CircleDashed}
          title="Bu dars tayyorlanmoqda"
          description="Dars mazmuni yozilib, rasmiy hujjatlar bilan tekshirilgach nashr qilinadi."
          action={
            <Button asChild variant="outline">
              <Link href="/app/kurs">Kurs dasturiga qaytish</Link>
            </Button>
          }
        />
      )}

      {lesson.access === "locked" && (
        <EmptyState
          icon={Lock}
          title="Bu dars toʻliq kursda"
          description="Darsni ochish uchun kursga kirish kerak."
          action={
            <Button asChild>
              <Link href="/narxlar">Tariflarni koʻrish</Link>
            </Button>
          }
        />
      )}

      {lesson.access === "open" && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <LessonPlayer
            lesson={lesson}
            mode="student"
            initialProgress={progress}
            videoConfigured={videoConfigured}
            narration={getNarrationForLesson(lesson.id)}
            actions={actions}
          />
          <LessonAside lesson={lesson} />
        </div>
      )}
    </article>
  );
}
