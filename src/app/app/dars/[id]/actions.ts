"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ProgressState } from "@/lib/data/learning";
import { progressErrorMessage } from "@/lib/progress-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Dars progressi amallari. Hamma tekshiruv bazadagi funksiyalarda
 * (qadam o'tkazib yuborish, kirish huquqi, tugatish shartlari).
 */

export type ProgressActionResult = { ok: true; progress: ProgressState } | { ok: false; message: string };

const lessonIdSchema = z.uuid();
const stepSchema = z.number().int().min(0).max(99);

type Row = { status: ProgressState["status"]; current_step: number; max_step_reached: number; video_percent: number };

function toState(row: Row): ProgressState {
  return {
    status: row.status,
    currentStep: row.current_step,
    maxStepReached: row.max_step_reached,
    videoPercent: row.video_percent,
  };
}

const INVALID: ProgressActionResult = { ok: false, message: "Notoʻgʻri soʻrov." };
const NOT_CONFIGURED: ProgressActionResult = { ok: false, message: "Baza hali ulanmagan." };

export async function startLessonAction(lessonId: string): Promise<ProgressActionResult> {
  if (!lessonIdSchema.safeParse(lessonId).success) return INVALID;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.rpc("start_lesson", { p_lesson_id: lessonId });
  if (error || !data) return { ok: false, message: progressErrorMessage(error?.message) };
  return { ok: true, progress: toState(data) };
}

export async function goToStepAction(lessonId: string, step: number): Promise<ProgressActionResult> {
  if (!lessonIdSchema.safeParse(lessonId).success || !stepSchema.safeParse(step).success) return INVALID;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.rpc("advance_lesson_step", { p_lesson_id: lessonId, p_step: step });
  if (error || !data) return { ok: false, message: progressErrorMessage(error?.message) };
  return { ok: true, progress: toState(data) };
}

export async function completeLessonAction(lessonId: string, minVideoPercent: number): Promise<ProgressActionResult> {
  if (!lessonIdSchema.safeParse(lessonId).success) return INVALID;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.rpc("complete_lesson", { p_lesson_id: lessonId });
  if (error || !data) return { ok: false, message: progressErrorMessage(error?.message, minVideoPercent) };
  revalidatePath("/app");
  revalidatePath("/app/kurs");
  return { ok: true, progress: toState(data) };
}

/** O'qish vaqti: sahifa ochiq va ko'rinib turganda har daqiqada. Xato jim o'tkaziladi. */
export async function recordLearningTimeAction(lessonId: string, seconds: number): Promise<void> {
  if (!lessonIdSchema.safeParse(lessonId).success) return;
  const safeSeconds = Math.max(1, Math.min(120, Math.round(seconds)));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.rpc("record_learning_time", { p_lesson_id: lessonId, p_seconds: safeSeconds });
}
