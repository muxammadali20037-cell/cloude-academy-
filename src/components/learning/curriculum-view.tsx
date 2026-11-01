import { ChevronDown, CircleCheck, CircleDashed, CirclePlay, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { Curriculum, CurriculumLesson } from "@/lib/data/curriculum-shape";
import { cn } from "@/lib/utils";

export type LessonState = "done" | "in_progress" | "open" | "free" | "locked" | "soon";

const STATE_META: Record<LessonState, { label: string; icon: typeof CircleCheck; className: string }> = {
  done: { label: "Tugatildi", icon: CircleCheck, className: "text-success" },
  in_progress: { label: "Davom etmoqda", icon: CirclePlay, className: "text-accent-fg" },
  open: { label: "Ochiq", icon: PlayCircle, className: "text-fg-muted" },
  free: { label: "Bepul", icon: PlayCircle, className: "text-accent-fg" },
  locked: { label: "Kursda", icon: Lock, className: "text-fg-subtle" },
  soon: { label: "Tez orada", icon: CircleDashed, className: "text-fg-subtle" },
};

export type CurriculumViewProps = {
  curriculum: Curriculum;
  stateOf: (lesson: CurriculumLesson) => LessonState;
  hrefOf?: (lesson: CurriculumLesson, state: LessonState) => string | null;
  /** Qaysi daraja ochiq turadi (standart: birinchisi). */
  openLevelNumber?: number | null;
  className?: string;
};

/**
 * Kurs dasturi: daraja → modul → dars. Darajalar yig'iladigan (mobil
 * qurilmada uzun ro'yxat bo'lmasligi uchun). JavaScript'siz ishlaydi.
 */
export function CurriculumView({ curriculum, stateOf, hrefOf, openLevelNumber, className }: CurriculumViewProps) {
  const openNumber = openLevelNumber ?? curriculum.levels[0]?.number;

  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-panel border border-line", className)}>
      {curriculum.levels.map((level) => {
        const states = level.modules.flatMap((module) => module.lessons.map(stateOf));
        const done = states.filter((state) => state === "done").length;
        return (
          <details key={level.id} open={level.number === openNumber} className="group">
            <summary
              className={cn(
                "flex cursor-pointer list-none items-start gap-4 px-4 py-4 transition-colors hover:bg-surface sm:px-6 sm:py-5",
                "[&::-webkit-details-marker]:hidden",
              )}
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-2 font-semibold tabular-nums text-fg"
              >
                {level.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg sm:text-lg">
                  <span className="sr-only">{level.number}-daraja: </span>
                  {level.title}
                </span>
                {level.description && <span className="mt-0.5 block text-sm text-fg-muted">{level.description}</span>}
                <span className="mt-1.5 block text-sm tabular-nums text-fg-subtle">
                  {level.modules.length} ta modul, {level.lessonCount} ta dars
                  {done > 0 && `, ${done} tasi tugatilgan`}
                </span>
              </span>
              <ChevronDown
                aria-hidden
                className="mt-2 size-5 shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="space-y-6 px-4 pb-6 sm:px-6 sm:pl-[4.75rem]">
              {level.modules.map((module) => (
                <section key={module.id} aria-label={module.title}>
                  <h3 className="mb-2 text-sm font-medium text-fg-muted">{module.title}</h3>
                  <ul className="divide-y divide-line rounded-card border border-line">
                    {module.lessons.map((lesson) => {
                      const state = stateOf(lesson);
                      const meta = STATE_META[state];
                      const Icon = meta.icon;
                      const href = hrefOf?.(lesson, state) ?? null;
                      const body = (
                        <>
                          <Icon aria-hidden className={cn("size-[1.125rem] shrink-0", meta.className)} strokeWidth={1.9} />
                          <span className={cn("min-w-0 flex-1", state === "soon" ? "text-fg-muted" : "text-fg")}>
                            {lesson.title}
                          </span>
                          <span className={cn("shrink-0 text-xs font-medium", meta.className)}>{meta.label}</span>
                        </>
                      );
                      return (
                        <li key={lesson.id}>
                          {href ? (
                            <Link
                              href={href}
                              className="flex min-h-12 items-center gap-3 px-3.5 py-2.5 text-[0.9375rem] transition-colors hover:bg-surface"
                            >
                              {body}
                            </Link>
                          ) : (
                            <div className="flex min-h-12 items-center gap-3 px-3.5 py-2.5 text-[0.9375rem]">{body}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
