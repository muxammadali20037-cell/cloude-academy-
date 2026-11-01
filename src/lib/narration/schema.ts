/**
 * Ovozli dars (narration) ma'lumot modeli.
 *
 * Ikki xil fayl bor:
 *  1. script.json — muallif yozadi: sahnalar, har bir qadamdagi harakat va
 *     o'qituvchi aytadigan matn. Vaqt yo'q.
 *  2. timeline.json — generator yaratadi: haqiqiy audio uzunligiga qarab har
 *     bir harakat va gapning aniq boshlanish/tugash vaqti.
 *
 * Pleyer faqat timeline.json va audio faylni o'qiydi. Animatsiya — kod,
 * ovoz — alohida fayl, ularni timeline'dagi vaqtlar bog'laydi.
 *
 * Bu fayl Node skriptidan ham ishlatiladi (tools/narration/build.ts), shuning
 * uchun importlar ".ts" kengaytmasi bilan yoziladi.
 */
import { z } from "zod";

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

const slug = z.string().regex(/^[a-z][a-z0-9-]*$/, "faqat kichik lotin harflari, raqam va chiziqcha");

const listItemSchema = z.object({
  id: slug,
  text: z.string().min(1).max(56),
  tone: z.enum(["lead", "item"]).default("item"),
});

const titleSceneSchema = z.object({
  type: z.literal("title"),
  eyebrow: z.string().min(1).max(40),
  title: z.string().min(1).max(32),
  lead: z.string().min(1).max(70),
});

const listSceneSchema = z.object({
  type: z.literal("list"),
  heading: z.string().min(1).max(36),
  marker: z.enum(["dot", "number", "warning"]).default("dot"),
  items: z.array(listItemSchema).min(1).max(5),
});

/** Sxematik brauzer oynasi: manzil qatori, xabar maydoni, yuborish tugmasi, javob. */
const browserSceneSchema = z.object({
  type: z.literal("browser"),
  url: z.string().min(1).max(40),
  notice: z.string().min(1).max(44),
  /** Xabar maydoniga yoziladigan matnlarning ichida ajratib ko'rsatiladigan bo'lak. */
  focus: z.string().min(1).max(40).optional(),
  answerLabel: z.string().min(1).max(30),
});

export const sceneSchema = z.discriminatedUnion("type", [titleSceneSchema, listSceneSchema, browserSceneSchema]);
export type Scene = z.infer<typeof sceneSchema>;
export type ListScene = z.infer<typeof listSceneSchema>;
export type BrowserScene = z.infer<typeof browserSceneSchema>;
export type TitleScene = z.infer<typeof titleSceneSchema>;

/** Har bir sahna turida qaysi elementlarga ishora qilish mumkin. */
export function sceneTargets(scene: Scene): string[] {
  switch (scene.type) {
    case "title":
      return ["eyebrow", "title", "lead"];
    case "list":
      return ["heading", ...scene.items.map((item) => item.id)];
    case "browser":
      return ["address", "page", "notice", "input", "focus", "send", "message", "answer"];
  }
}

/** Kursor boradigan (bosiladigan) elementlar — ular uchun ekrandagi joy aniq bo'lishi kerak. */
export const POINTABLE_TARGETS = new Set(["address", "input", "send", "answer", "notice", "message"]);

export const actionSchema = z.discriminatedUnion("do", [
  /** Element paydo bo'ladi. */
  z.object({ do: z.literal("reveal"), target: slug }),
  /** Kursor elementga boradi va bosadi. */
  z.object({ do: z.literal("click"), target: slug }),
  /** Kursor elementga boradi (bosmaydi). */
  z.object({ do: z.literal("point"), target: slug }),
  /** Maydonga matn yoziladi. */
  z.object({ do: z.literal("type"), target: slug, text: z.string().min(1).max(160) }),
  /** Klaviatura tugmasi bosiladi (ekranda tugma belgisi chiqadi). */
  z.object({ do: z.literal("press"), key: z.string().min(1).max(12) }),
  /** Maydondagi matn yuboriladi: xabar sifatida ko'rinadi, maydon tozalanadi. */
  z.object({ do: z.literal("submit"), target: slug }),
  /** Javob qatorma-qator chiqadi. */
  z.object({ do: z.literal("stream"), target: slug }),
]);
export type StageAction = z.infer<typeof actionSchema>;

export const scriptCueSchema = z.object({
  id: slug,
  purpose: z.enum(PURPOSES),
  scene: slug,
  actions: z.array(actionSchema).max(4).default([]),
  /** Gap davomida ajratib ko'rsatiladigan element. */
  highlight: slug.optional(),
  /** O'qituvchi aytadigan va subtitrda chiqadigan matn (o'zbek lotin). */
  text: z.string().min(2).max(140),
  /** TTS uchun boshqacha o'qilishi kerak bo'lsa (masalan, qisqartma). */
  speech: z.string().min(2).max(220).optional(),
  /** Gapdan keyingi qo'shimcha pauza, soniya. */
  pauseAfter: z.number().min(0).max(2).optional(),
});
export type ScriptCue = z.infer<typeof scriptCueSchema>;

export const voiceSchema = z.object({
  azure: z.object({ name: z.string().min(1), rate: z.string().regex(/^[+-]?\d{1,2}%$/) }),
  mms: z.object({ model: z.string().min(1), speakingRate: z.number().min(0.6).max(1.4), seed: z.number().int() }),
});

export const scriptSchema = z
  .object({
    key: slug,
    lessonId: z.uuid(),
    title: z.string().min(2).max(120),
    /** AI yozgan ssenariy admin tasdiqlamaguncha "review" holatida qoladi. */
    status: z.enum(["draft", "review", "approved"]),
    sources: z.array(z.url()).default([]),
    voice: voiceSchema,
    /** TTS uchun talaffuz: inglizcha nomlar o'zbekcha o'qilishi uchun. */
    lexicon: z.array(z.object({ match: z.string().min(1), say: z.string().min(1) })).default([]),
    scenes: z.record(slug, sceneSchema),
    cues: z.array(scriptCueSchema).min(1),
  })
  .superRefine((script, ctx) => {
    const seen = new Set<string>();
    script.cues.forEach((cue, index) => {
      const path = ["cues", index];
      if (seen.has(cue.id)) ctx.addIssue({ code: "custom", path: [...path, "id"], message: `takroriy id: ${cue.id}` });
      seen.add(cue.id);

      const scene = script.scenes[cue.scene];
      if (!scene) {
        ctx.addIssue({ code: "custom", path: [...path, "scene"], message: `sahna topilmadi: ${cue.scene}` });
        return;
      }
      const targets = new Set(sceneTargets(scene));
      if (cue.highlight && !targets.has(cue.highlight)) {
        ctx.addIssue({ code: "custom", path: [...path, "highlight"], message: `${cue.scene} sahnasida "${cue.highlight}" yo'q` });
      }
      // Harakatsiz gap bo'lmaydi: o'qituvchi faqat ekranda ko'rinayotgan narsani tushuntiradi.
      if (cue.actions.length === 0 && !cue.highlight) {
        ctx.addIssue({ code: "custom", path, message: "har bir gapda kamida bitta harakat yoki ajratilgan element bo'lishi kerak" });
      }
      cue.actions.forEach((action, actionIndex) => {
        if (!("target" in action)) return;
        if (!targets.has(action.target)) {
          ctx.addIssue({ code: "custom", path: [...path, "actions", actionIndex], message: `${cue.scene} sahnasida "${action.target}" yo'q` });
        }
        if ((action.do === "click" || action.do === "point") && !POINTABLE_TARGETS.has(action.target)) {
          ctx.addIssue({ code: "custom", path: [...path, "actions", actionIndex], message: `"${action.target}" ga kursor bilan borib bo'lmaydi` });
        }
      });
      // Raqamlar so'z bilan yoziladi: TTS raqamni noto'g'ri o'qishi mumkin.
      if (/\d/.test(cue.speech ?? cue.text)) {
        ctx.addIssue({ code: "custom", path: [...path, "text"], message: "aytiladigan matnda raqam bo'lmasin — so'z bilan yozing" });
      }
    });
  });
export type NarrationScript = z.infer<typeof scriptSchema>;

/* ---------- Generator natijasi: timeline.json ---------- */

const seconds = z.number().min(0);

export const timedActionSchema = z.intersection(
  actionSchema,
  z.object({
    /** Harakat boshlanadi. */
    start: seconds,
    /** Harakat ekranda ko'rinadigan payt (kursor yetib keldi, matn yozila boshladi...). */
    visibleAt: seconds,
    /** Animatsiya tugaydi. */
    end: seconds,
  }),
);
export type TimedAction = z.infer<typeof timedActionSchema>;

export const timelineCueSchema = z.object({
  id: slug,
  purpose: z.enum(PURPOSES),
  scene: slug,
  text: z.string(),
  highlight: slug.optional(),
  start: seconds,
  end: seconds,
  audioStart: seconds,
  audioEnd: seconds,
  actions: z.array(timedActionSchema),
});
export type TimelineCue = z.infer<typeof timelineCueSchema>;

export const audioInfoSchema = z.object({
  src: z.string().min(1),
  /** azure — ishlab chiqarish uchun; mms — faqat sinov (notijorat litsenziya). */
  provider: z.enum(["azure", "mms"]),
  voice: z.string(),
  license: z.string(),
  commercialUse: z.boolean(),
  generatedAt: z.iso.datetime(),
  bytes: z.number().int().positive(),
});
export type AudioInfo = z.infer<typeof audioInfoSchema>;

export const timelineSchema = z.object({
  version: z.literal(1),
  key: slug,
  lessonId: z.uuid(),
  title: z.string(),
  status: z.enum(["draft", "review", "approved"]),
  scriptHash: z.string().regex(/^[a-f0-9]{64}$/),
  duration: seconds,
  /** null — ovoz yaratilmagan: pleyer subtitr bilan ovozsiz ishlaydi. */
  audio: audioInfoSchema.nullable(),
  subtitles: z.string().nullable(),
  scenes: z.record(slug, sceneSchema),
  cues: z.array(timelineCueSchema).min(1),
});
export type Timeline = z.infer<typeof timelineSchema>;
