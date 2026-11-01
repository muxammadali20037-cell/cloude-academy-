import type { Enums } from "@/lib/supabase/database.types";

/** Bazadan kelgan ichma-ich ma'lumot (tartiblanmagan). */
export type RawCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  course_levels: {
    id: string;
    number: number;
    title: string;
    description: string | null;
    modules: {
      id: string;
      title: string;
      sort_order: number;
      lessons: {
        id: string;
        title: string;
        status: Enums<"content_status">;
        is_free_preview: boolean;
        sort_order: number;
        estimated_minutes: number | null;
      }[];
    }[];
  }[];
};

export type CurriculumLesson = {
  id: string;
  title: string;
  status: Enums<"content_status">;
  isFreePreview: boolean;
  estimatedMinutes: number | null;
};

export type CurriculumModule = { id: string; title: string; lessons: CurriculumLesson[] };

export type CurriculumLevel = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  modules: CurriculumModule[];
  lessonCount: number;
};

export type Curriculum = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  levels: CurriculumLevel[];
  lessonCount: number;
  publishedLessonCount: number;
};

/** Daraja → modul → dars tartibida saralaydi va sanaydi. */
export function sortCurriculum(raw: RawCourse): Curriculum {
  const levels = [...(raw.course_levels ?? [])]
    .sort((a, b) => a.number - b.number)
    .map((level) => {
      const modules = [...(level.modules ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((module) => ({
          id: module.id,
          title: module.title,
          lessons: [...(module.lessons ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              status: lesson.status,
              isFreePreview: lesson.is_free_preview,
              estimatedMinutes: lesson.estimated_minutes,
            })),
        }));
      return {
        id: level.id,
        number: level.number,
        title: level.title,
        description: level.description,
        modules,
        lessonCount: modules.reduce((sum, module) => sum + module.lessons.length, 0),
      };
    });

  const allLessons = levels.flatMap((level) => level.modules.flatMap((module) => module.lessons));
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description,
    levels,
    lessonCount: allLessons.length,
    publishedLessonCount: allLessons.filter((lesson) => lesson.status === "published").length,
  };
}

/** Bepul (namunaviy) darslar ro'yxati. */
export function freePreviewLessons(curriculum: Curriculum) {
  return curriculum.levels.flatMap((level) =>
    level.modules.flatMap((module) =>
      module.lessons
        .filter((lesson) => lesson.isFreePreview && lesson.status === "published")
        .map((lesson) => ({ ...lesson, levelNumber: level.number, moduleTitle: module.title })),
    ),
  );
}

/**
 * Narxni so'mda formatlaydi: 49000000 tiyin → "490 000 soʻm".
 * Bo'sh joylar uzilmaydigan (NBSP): narx qatorga bo'linib ketmaydi.
 */
export function formatPriceUzs(tiyin: number) {
  const sum = Math.round(tiyin / 100);
  const grouped = String(sum).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${grouped}\u00a0soʻm`;
}
