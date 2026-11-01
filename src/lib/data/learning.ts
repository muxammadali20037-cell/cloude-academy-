import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { z } from "zod";
import { MAIN_COURSE_SLUG } from "@/lib/supabase/config";
import type { Database, Enums } from "@/lib/supabase/database.types";
import { createSupabasePublicClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { notConfigured, notFound, ok, unavailable, type DataResult } from "./result";

type Client = SupabaseClient<Database>;

export type LessonStep = {
  id: string;
  kind: Enums<"lesson_step_kind">;
  title: string;
  bodyMd: string | null;
};

export type LessonMediaItem = {
  id: string;
  kind: Enums<"media_kind">;
  provider: string;
  playbackId: string | null;
  durationSec: number | null;
};

export type LessonAccess = "open" | "locked" | "planned";

export type LessonDetail = {
  id: string;
  title: string;
  summary: string | null;
  status: Enums<"content_status">;
  isFreePreview: boolean;
  estimatedMinutes: number | null;
  sourceUrls: string[];
  verifiedAt: string | null;
  completionRule: { minVideoPercent: number; requireAllSteps: boolean };
  moduleTitle: string;
  levelNumber: number;
  levelTitle: string;
  courseId: string;
  steps: LessonStep[];
  media: LessonMediaItem[];
  access: LessonAccess;
};

const LESSON_SELECT = `
  id, title, summary, status, is_free_preview, estimated_minutes, source_urls, verified_at, completion_rule,
  modules ( title, course_levels ( number, title, course_id ) ),
  lesson_content ( id, kind, title, body_md, sort_order ),
  lesson_media ( id, kind, provider, playback_id, duration_sec )
` as const;

type RawLesson = {
  id: string;
  title: string;
  summary: string | null;
  status: Enums<"content_status">;
  is_free_preview: boolean;
  estimated_minutes: number | null;
  source_urls: string[];
  verified_at: string | null;
  completion_rule: { min_video_percent?: number; require_all_steps?: boolean } | null;
  modules: { title: string; course_levels: { number: number; title: string; course_id: string } | null } | null;
  lesson_content: { id: string; kind: Enums<"lesson_step_kind">; title: string; body_md: string | null; sort_order: number }[];
  lesson_media: { id: string; kind: Enums<"media_kind">; provider: string; playback_id: string | null; duration_sec: number | null }[];
};

const uuid = z.uuid();

async function hasActiveAccess(client: Client, courseId: string) {
  const { data, error } = await client
    .from("access_grants")
    .select("starts_at, ends_at, revoked_at")
    .eq("course_id", courseId)
    .is("revoked_at", null);
  if (error || !data) return false;
  const now = Date.now();
  return data.some(
    (grant) => Date.parse(grant.starts_at) <= now && (grant.ends_at === null || Date.parse(grant.ends_at) > now),
  );
}

async function fetchLesson(client: Client, lessonId: string, signedIn: boolean): Promise<DataResult<LessonDetail>> {
  if (!uuid.safeParse(lessonId).success) return notFound;
  try {
    const { data, error } = await client.from("lessons").select(LESSON_SELECT).eq("id", lessonId).maybeSingle();
    if (error) return unavailable;
    if (!data) return notFound;
    const raw = data as unknown as RawLesson;
    const level = raw.modules?.course_levels;
    if (!raw.modules || !level) return notFound;

    const steps = [...raw.lesson_content]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((step) => ({ id: step.id, kind: step.kind, title: step.title, bodyMd: step.body_md }));

    let access: LessonAccess;
    if (raw.status !== "published") access = "planned";
    else if (steps.length > 0 || raw.is_free_preview) access = "open";
    else access = signedIn && (await hasActiveAccess(client, level.course_id)) ? "open" : "locked";

    return ok({
      id: raw.id,
      title: raw.title,
      summary: raw.summary,
      status: raw.status,
      isFreePreview: raw.is_free_preview,
      estimatedMinutes: raw.estimated_minutes,
      sourceUrls: raw.source_urls ?? [],
      verifiedAt: raw.verified_at,
      completionRule: {
        minVideoPercent: raw.completion_rule?.min_video_percent ?? 0,
        requireAllSteps: raw.completion_rule?.require_all_steps ?? true,
      },
      moduleTitle: raw.modules.title,
      levelNumber: level.number,
      levelTitle: level.title,
      courseId: level.course_id,
      steps,
      media: raw.lesson_media.map((item) => ({
        id: item.id,
        kind: item.kind,
        provider: item.provider,
        playbackId: item.playback_id,
        durationSec: item.duration_sec,
      })),
      access,
    });
  } catch {
    return unavailable;
  }
}

/** Kirgan talaba uchun dars (RLS: kirish huquqi bo'lsa mazmuni keladi). */
export async function getLessonForStudent(lessonId: string) {
  const client = await createSupabaseServerClient();
  if (!client) return notConfigured;
  return fetchLesson(client, lessonId, true);
}

/** Akkauntsiz ko'rish: faqat bepul darslar ochiladi. */
export async function getLessonForVisitor(lessonId: string) {
  const client = createSupabasePublicClient();
  if (!client) return notConfigured;
  return fetchLesson(client, lessonId, false);
}

export type ProgressState = {
  status: Enums<"progress_status">;
  currentStep: number;
  maxStepReached: number;
  videoPercent: number;
};

export async function getMyLessonProgress(lessonId: string): Promise<ProgressState | null> {
  if (!uuid.safeParse(lessonId).success) return null;
  const client = await createSupabaseServerClient();
  if (!client) return null;
  try {
    const { data } = await client
      .from("lesson_progress")
      .select("status, current_step, max_step_reached, video_percent")
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (!data) return null;
    return {
      status: data.status,
      currentStep: data.current_step,
      maxStepReached: data.max_step_reached,
      videoPercent: data.video_percent,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------

const overviewSchema = z.object({
  course_id: z.string(),
  course_title: z.string(),
  has_access: z.boolean(),
  total_lessons: z.number(),
  published_lessons: z.number(),
  completed_lessons: z.number(),
  in_progress_lessons: z.number(),
  total_modules: z.number(),
  completed_modules: z.number(),
  current_level: z.number().nullable(),
  next_lesson: z.object({ id: z.string(), title: z.string(), level_number: z.number() }).nullable(),
  learning_minutes: z.number(),
  streak_days: z.number(),
});

export type CourseOverview = z.infer<typeof overviewSchema>;

/** Talabaning kurs bo'yicha umumiy holati. Bitta so'rov ichida bir marta olinadi. */
export const getMyOverview = cache(async (slug: string = MAIN_COURSE_SLUG): Promise<DataResult<CourseOverview>> => {
  const client = await createSupabaseServerClient();
  if (!client) return notConfigured;
  try {
    const { data, error } = await client.rpc("my_course_overview", { p_course_slug: slug });
    if (error) return unavailable;
    if (data === null) return notFound;
    const parsed = overviewSchema.safeParse(data);
    return parsed.success ? ok(parsed.data) : unavailable;
  } catch {
    return unavailable;
  }
});

export type MyProfile = { fullName: string | null };

export const getMyProfile = cache(async (userId: string): Promise<MyProfile | null> => {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  try {
    const { data } = await client.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    return data ? { fullName: data.full_name } : null;
  } catch {
    return null;
  }
});

/** Umumiy progress foizi: tugatilgan / dasturdagi barcha darslar. */
export function overallPercent(overview: Pick<CourseOverview, "completed_lessons" | "total_lessons">) {
  if (overview.total_lessons <= 0) return 0;
  return Math.round((overview.completed_lessons / overview.total_lessons) * 100);
}
