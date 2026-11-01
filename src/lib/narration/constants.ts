/**
 * Ovozli dars doimiy qiymatlari. Bu fayl brauzer kodiga ham kiradi, shuning
 * uchun bu yerda zod yoki boshqa og'ir kutubxona import qilinmaydi.
 */

/** Sahnaning mantiqiy o'lchami. Ekranga mos ravishda kichraytiriladi. */
export const STAGE = { width: 960, height: 540 } as const;

/** O'qituvchi har bir gapda nima qilyapti: darsda beshalasi ham bo'lishi shart. */
export const PURPOSES = ["what", "why", "where", "result", "error"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const PURPOSE_LABELS: Record<Purpose, string> = {
  what: "Nima qilyapmiz",
  why: "Nega",
  where: "Qayerga",
  result: "Natija",
  error: "Xato chiqsa",
};
