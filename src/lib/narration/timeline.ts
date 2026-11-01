/**
 * Vaqt shkalasini qurish: ssenariy + har bir gapning haqiqiy audio uzunligi
 * → har bir harakat, gap va subtitrning aniq vaqti.
 *
 * Asosiy qoida: o'qituvchi harakatni u ekranda ko'ringandan KEYIN tushuntiradi.
 * Shuning uchun gap har doim shu qadamdagi barcha harakatlar ko'rinib
 * bo'lgandan keyin boshlanadi.
 *
 * Hisob butun millisekundlarda olib boriladi (kasr xatolari yig'ilmasligi uchun).
 */
import type { NarrationScript, ScriptCue, StageAction, TimedAction, Timeline, TimelineCue, AudioInfo } from "./schema.ts";

export const TIMING = {
  /** Yangi sahna paydo bo'lish vaqti. */
  sceneFadeMs: 350,
  /** Kursor bir joydan ikkinchisiga borish vaqti. */
  cursorTravelMs: 600,
  clickHoldMs: 350,
  revealMs: 400,
  /** Bir nechta element ketma-ket paydo bo'lganda oradagi farq. */
  revealStaggerMs: 160,
  typeCharsPerSecond: 24,
  pressMs: 900,
  submitMs: 400,
  streamMs: 2600,
  /** Harakat ko'rinishi bilan gap boshlanishi orasidagi eng kam farq. */
  speakAfterVisibleMs: 120,
  /** Gapdan keyingi pauza. */
  gapAfterMs: 380,
  /** Sahna almashishidan oldingi pauza. */
  sceneGapAfterMs: 650,
  /** Animatsiya tugagach, keyingi qadamgacha kutish. */
  settleMs: 250,
  /** Audio yo'q bo'lganda gap uzunligini taxmin qilish (belgi/soniya). */
  estimatedCharsPerSecond: 13,
  minSpeechMs: 1200,
} as const;

const ms = (secondsValue: number) => Math.round(secondsValue * 1000);
const sec = (millis: number) => millis / 1000;

type ActionPlan = { offset: number; visible: number; end: number; next: number };

/** Bitta harakatning qadam ichidagi vaqtlari (qadam boshidan, ms). */
export function planAction(action: StageAction, offset: number): ActionPlan {
  switch (action.do) {
    case "reveal":
      return { offset, visible: offset + 150, end: offset + TIMING.revealMs, next: offset + TIMING.revealStaggerMs };
    case "click":
    case "point": {
      const arrive = offset + TIMING.cursorTravelMs;
      const end = arrive + (action.do === "click" ? TIMING.clickHoldMs : 0);
      return { offset, visible: arrive, end, next: arrive + 100 };
    }
    case "type": {
      const end = offset + Math.round((action.text.length / TIMING.typeCharsPerSecond) * 1000);
      return { offset, visible: offset + 80, end, next: end + 150 };
    }
    case "press":
      return { offset, visible: offset + 60, end: offset + TIMING.pressMs, next: offset + 250 };
    case "submit":
      return { offset, visible: offset + 100, end: offset + TIMING.submitMs, next: offset + 300 };
    case "stream":
      return { offset, visible: offset + 250, end: offset + TIMING.streamMs, next: offset + 250 };
  }
}

/** Audio bo'lmaganda gap uzunligi taxmini (soniya). */
export function estimateSpeechSeconds(text: string) {
  return Math.max(TIMING.minSpeechMs, Math.round((text.length / TIMING.estimatedCharsPerSecond) * 1000)) / 1000;
}

export type BuildTimelineInput = {
  script: NarrationScript;
  scriptHash: string;
  /** Har bir gap (cue id) uchun haqiqiy audio uzunligi, soniya. null — audio yo'q. */
  speechSeconds: Record<string, number> | null;
  audio: AudioInfo | null;
  subtitles: string | null;
};

export function buildTimeline({ script, scriptHash, speechSeconds, audio, subtitles }: BuildTimelineInput): Timeline {
  let cursor = 0;
  const cues: TimelineCue[] = script.cues.map((cue: ScriptCue, index) => {
    const previous = script.cues[index - 1];
    const next = script.cues[index + 1];
    const sceneChanged = !previous || previous.scene !== cue.scene;
    const start = cursor;

    let offset = sceneChanged ? TIMING.sceneFadeMs : 0;
    let lastVisible = offset;
    let lastEnd = offset;
    const actions: TimedAction[] = cue.actions.map((action) => {
      const plan = planAction(action, offset);
      offset = plan.next;
      lastVisible = Math.max(lastVisible, plan.visible);
      lastEnd = Math.max(lastEnd, plan.end);
      return { ...action, start: sec(start + plan.offset), visibleAt: sec(start + plan.visible), end: sec(start + plan.end) };
    });
    if (cue.highlight) lastVisible = Math.max(lastVisible, offset + 150);

    const speechMs = speechSeconds
      ? requireDuration(speechSeconds, cue.id)
      : ms(estimateSpeechSeconds(cue.speech ?? cue.text));

    const audioStart = start + lastVisible + TIMING.speakAfterVisibleMs;
    const audioEnd = audioStart + speechMs;
    const pause = cue.pauseAfter !== undefined
      ? ms(cue.pauseAfter)
      : next && next.scene !== cue.scene
        ? TIMING.sceneGapAfterMs
        : TIMING.gapAfterMs;
    const end = Math.max(audioEnd + pause, start + lastEnd + TIMING.settleMs);
    cursor = end;

    return {
      id: cue.id,
      purpose: cue.purpose,
      scene: cue.scene,
      text: cue.text,
      ...(cue.highlight ? { highlight: cue.highlight } : {}),
      start: sec(start),
      end: sec(end),
      audioStart: sec(audioStart),
      audioEnd: sec(audioEnd),
      actions,
    };
  });

  return {
    version: 1,
    key: script.key,
    lessonId: script.lessonId,
    title: script.title,
    status: script.status,
    scriptHash,
    duration: sec(cursor),
    audio,
    subtitles,
    scenes: script.scenes,
    cues,
  };
}

function requireDuration(durations: Record<string, number>, id: string) {
  const value = durations[id];
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new Error(`"${id}" gapi uchun audio uzunligi yo'q`);
  }
  return Math.ceil(value * 1000);
}

/**
 * Vaqt shkalasi qoidalarini tekshiradi. Bo'sh ro'yxat — hammasi to'g'ri.
 * Generator ham, testlar ham shu funksiyadan foydalanadi.
 */
export function timelineProblems(timeline: Timeline): string[] {
  const problems: string[] = [];
  const eps = 0.0005;
  let previousEnd = 0;
  let previousAudioEnd = 0;

  timeline.cues.forEach((cue) => {
    if (Math.abs(cue.start - previousEnd) > eps) problems.push(`${cue.id}: oldingi qadam tugagan joydan boshlanmagan`);
    if (cue.end <= cue.start) problems.push(`${cue.id}: uzunligi nol`);
    if (cue.audioStart < previousAudioEnd - eps) problems.push(`${cue.id}: ovoz oldingi gap ustiga tushgan`);
    if (cue.audioEnd > cue.end + eps) problems.push(`${cue.id}: ovoz qadam tugagandan keyin ham davom etadi`);
    for (const action of cue.actions) {
      if (action.start < cue.start - eps || action.end > cue.end + eps) problems.push(`${cue.id}: harakat qadamdan tashqarida`);
      // Asosiy qoida: avval ko'rsatiladi, keyin aytiladi.
      if (action.visibleAt > cue.audioStart + eps) problems.push(`${cue.id}: "${action.do}" ko'rinishidan oldin aytilmoqda`);
    }
    previousEnd = cue.end;
    previousAudioEnd = cue.audioEnd;
  });

  if (Math.abs(timeline.duration - previousEnd) > eps) problems.push("umumiy uzunlik oxirgi qadam bilan mos emas");
  return problems;
}

/** Darsda o'qituvchi beshala savolga javob berganmi: nima, nega, qayerga, natija, xato. */
export function missingPurposes(lesson: { cues: { purpose: TimelineCue["purpose"] }[] }) {
  const present = new Set(lesson.cues.map((cue) => cue.purpose));
  return (["what", "why", "where", "result", "error"] as const).filter((purpose) => !present.has(purpose));
}

/** t vaqtdagi qadam indeksi (t < 0 → 0, oxiridan keyin → oxirgisi). */
export function cueIndexAt(cues: Pick<TimelineCue, "start">[], t: number) {
  let low = 0;
  let high = cues.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (cues[mid].start <= t) low = mid;
    else high = mid - 1;
  }
  return low;
}
