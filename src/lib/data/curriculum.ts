import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAIN_COURSE_SLUG } from "@/lib/supabase/config";
import type { Database, Enums } from "@/lib/supabase/database.types";
import { createSupabasePublicClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { notConfigured, notFound, ok, unavailable, type DataResult } from "./result";
import { sortCurriculum, type Curriculum, type RawCourse } from "./curriculum-shape";

type Client = SupabaseClient<Database>;

const CURRICULUM_SELECT = `
  id, slug, title, subtitle, description,
  course_levels (
    id, number, title, description,
    modules (
      id, title, sort_order,
      lessons ( id, title, status, is_free_preview, sort_order, estimated_minutes )
    )
  )
` as const;

async function fetchCurriculum(client: Client, slug: string): Promise<DataResult<Curriculum>> {
  try {
    const { data, error } = await client.from("courses").select(CURRICULUM_SELECT).eq("slug", slug).maybeSingle();
    if (error) return unavailable;
    if (!data) return notFound;
    return ok(sortCurriculum(data as unknown as RawCourse));
  } catch {
    return unavailable;
  }
}

/** Ochiq dastur (landing, /dastur): faqat e'lon qilingan va nashr qilingan. */
export async function getPublicCurriculum(slug = MAIN_COURSE_SLUG): Promise<DataResult<Curriculum>> {
  const client = createSupabasePublicClient();
  if (!client) return notConfigured;
  return fetchCurriculum(client, slug);
}

export type LessonProgressMap = Record<string, Enums<"progress_status">>;

/** Talaba uchun dastur va uning progressi. */
export async function getMyCurriculum(
  slug = MAIN_COURSE_SLUG,
): Promise<DataResult<{ curriculum: Curriculum; progress: LessonProgressMap }>> {
  const client = await createSupabaseServerClient();
  if (!client) return notConfigured;
  const curriculum = await fetchCurriculum(client, slug);
  if (curriculum.status !== "ok") return curriculum;

  try {
    const { data, error } = await client.from("lesson_progress").select("lesson_id, status");
    if (error) return unavailable;
    const progress: LessonProgressMap = {};
    for (const row of data ?? []) progress[row.lesson_id] = row.status;
    return ok({ curriculum: curriculum.data, progress });
  } catch {
    return unavailable;
  }
}

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceTiyin: number;
  durationDays: number | null;
  features: string[];
};

/** Faol tariflar (narxi belgilangan). Narxlar faqat bazadan. */
export async function getActivePlans(): Promise<DataResult<PublicPlan[]>> {
  const client = createSupabasePublicClient();
  if (!client) return notConfigured;
  try {
    const { data, error } = await client
      .from("plans")
      .select("id, code, name, description, price_tiyin, duration_days, features")
      .eq("is_active", true)
      .order("sort_order");
    if (error) return unavailable;
    return ok(
      (data ?? [])
        .filter((plan) => plan.price_tiyin !== null)
        .map((plan) => ({
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          priceTiyin: plan.price_tiyin as number,
          durationDays: plan.duration_days,
          features: plan.features,
        })),
    );
  } catch {
    return unavailable;
  }
}
