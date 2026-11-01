/**
 * Tayyor ovozli darslar ro'yxati.
 *
 * Vaqt shkalalari build paytida import qilinadi va tekshiriladi: buzilgan
 * fayl bilan sayt yig'ilmaydi. Audio fayllar public/narration/ da alohida turadi.
 * Yangi dars: content/narration/<key>/ yarating, generatorni ishga tushiring
 * va timeline.json ni shu ro'yxatga qo'shing.
 */
import lesson1 from "../../../content/narration/l1-m1-01/timeline.json";
import { timelineSchema, type Timeline } from "./schema";

const TIMELINES: Timeline[] = [lesson1].map((raw) => timelineSchema.parse(raw));

export function getNarrationByKey(key: string): Timeline | null {
  return TIMELINES.find((timeline) => timeline.key === key) ?? null;
}

export function getNarrationForLesson(lessonId: string): Timeline | null {
  return TIMELINES.find((timeline) => timeline.lessonId === lessonId) ?? null;
}
