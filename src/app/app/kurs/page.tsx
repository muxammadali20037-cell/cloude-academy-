import type { Metadata } from "next";
import { CurriculumView, type LessonState } from "@/components/learning/curriculum-view";
import { requireUser } from "@/lib/auth";
import { getMyCurriculum } from "@/lib/data/curriculum";
import type { CurriculumLesson } from "@/lib/data/curriculum-shape";
import { getMyOverview } from "@/lib/data/learning";
import { DataUnavailable } from "../_components/data-state";

export const metadata: Metadata = { title: "Kurs" };

export default async function CoursePage() {
  await requireUser("/app/kurs");
  const [result, overview] = await Promise.all([getMyCurriculum(), getMyOverview()]);

  if (result.status !== "ok") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Kurs</h1>
        <DataUnavailable status={result.status} />
      </div>
    );
  }

  const { curriculum, progress } = result.data;
  const hasAccess = overview.status === "ok" && overview.data.has_access;
  const currentLevel = overview.status === "ok" ? overview.data.current_level : null;

  const stateOf = (lesson: CurriculumLesson): LessonState => {
    const status = progress[lesson.id];
    if (status === "completed") return "done";
    if (status === "in_progress") return "in_progress";
    if (lesson.status !== "published") return "soon";
    if (lesson.isFreePreview) return "free";
    return hasAccess ? "open" : "locked";
  };

  const hrefOf = (lesson: CurriculumLesson, state: LessonState) =>
    state === "soon" || state === "locked" ? null : `/app/dars/${lesson.id}`;

  return (
    <div className="space-y-6">
      <header className="max-w-[65ch]">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{curriculum.title}</h1>
        {curriculum.description && <p className="mt-2 text-fg-muted">{curriculum.description}</p>}
        <p className="mt-2 text-sm tabular-nums text-fg-subtle">
          {curriculum.levels.length} ta daraja, {curriculum.lessonCount} ta dars.{" "}
          {curriculum.publishedLessonCount === 0
            ? "Darslar tayyorlanmoqda — har biri tekshirilgach nashr qilinadi."
            : `${curriculum.publishedLessonCount} tasi nashr qilingan.`}
        </p>
      </header>
      <CurriculumView curriculum={curriculum} stateOf={stateOf} hrefOf={hrefOf} openLevelNumber={currentLevel} />
    </div>
  );
}
