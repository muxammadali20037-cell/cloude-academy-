/**
 * Sahnaning t vaqtdagi holati — sof funksiya.
 *
 * Animatsiya CSS taymerlariga emas, faqat vaqtga bog'liq. Shuning uchun:
 *  - pleyer istalgan joyga o'tganda (seek) sahna darhol to'g'ri holatda bo'ladi;
 *  - tezlik o'zgarsa, animatsiya ovoz bilan birga tezlashadi/sekinlashadi;
 *  - har bir kadrni testda tekshirish mumkin.
 */
import { centerOf, CURSOR_REST, sceneLayout } from "./layout.ts";
import type { Scene, Timeline, TimelineCue } from "./schema.ts";
import { cueIndexAt, TIMING } from "./timeline.ts";

export type CursorState = { x: number; y: number; visible: boolean; clickProgress: number | null };

export type StageState = {
  cueIndex: number;
  cue: TimelineCue;
  sceneId: string;
  scene: Scene;
  /** Sahna paydo bo'lishi: 0 → 1. */
  sceneProgress: number;
  /** Paydo bo'lgan elementlar: 0 → 1. */
  revealed: Record<string, number>;
  /** Maydonlardagi joriy matn. */
  typed: Record<string, string>;
  /** Hozir yozilayotgan maydon (kursor-chiziq ko'rinadi). */
  typingTarget: string | null;
  /** Yuborilgan xabarlar. */
  sent: string[];
  /** Qatorma-qator chiqayotgan javob: 0 → 1. */
  streamed: Record<string, number>;
  cursor: CursorState;
  highlight: { target: string; strength: number } | null;
  key: { label: string; progress: number } | null;
  /** O'qituvchi hozir gapiryaptimi. */
  speaking: boolean;
  /** Subtitr ko'rinadimi (gap boshlangandan qadam oxirigacha). */
  subtitleVisible: boolean;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

/** Joriy sahna bloki: ketma-ket kelgan bir xil sahnali qadamlar. */
function sceneBlockStart(cues: TimelineCue[], index: number) {
  let first = index;
  while (first > 0 && cues[first - 1].scene === cues[index].scene) first -= 1;
  return first;
}

export function stageStateAt(timeline: Timeline, time: number): StageState {
  const t = Math.min(Math.max(time, 0), timeline.duration);
  const cues = timeline.cues;
  const cueIndex = cueIndexAt(cues, t);
  const cue = cues[cueIndex];
  const scene = timeline.scenes[cue.scene];
  const layout = sceneLayout(scene) as Record<string, { x: number; y: number; w: number; h: number }>;
  const blockStart = sceneBlockStart(cues, cueIndex);

  const revealed: Record<string, number> = {};
  const typed: Record<string, string> = {};
  const streamed: Record<string, number> = {};
  const sent: string[] = [];
  let typingTarget: string | null = null;
  let key: StageState["key"] = null;

  let cursorFrom = CURSOR_REST;
  let cursorTo = CURSOR_REST;
  let cursorStart = -Infinity;
  let clickAt: number | null = null;

  for (let i = blockStart; i <= cueIndex; i += 1) {
    for (const action of cues[i].actions) {
      if (action.start > t) continue;
      const progress = clamp01((t - action.start) / Math.max(0.001, action.end - action.start));
      switch (action.do) {
        case "reveal":
          revealed[action.target] = easeOutCubic(progress);
          break;
        case "type": {
          const count = Math.round(action.text.length * progress);
          typed[action.target] = action.text.slice(0, count);
          if (t <= action.end + 0.6) typingTarget = action.target;
          break;
        }
        case "submit":
          if (typed[action.target]) sent.push(typed[action.target]);
          typed[action.target] = "";
          if (typingTarget === action.target) typingTarget = null;
          break;
        case "stream":
          streamed[action.target] = progress;
          break;
        case "press":
          if (t <= action.end) key = { label: action.key, progress };
          break;
        case "click":
        case "point": {
          const rect = layout[action.target];
          if (!rect) break;
          // Oldingi harakat tugamagan bo'lsa ham, kursor hozirgi joyidan yo'lga chiqadi.
          cursorFrom = cursorPosition(cursorFrom, cursorTo, cursorStart, action.start);
          cursorTo = centerOf(rect);
          cursorStart = action.start;
          clickAt = action.do === "click" ? action.visibleAt : null;
          break;
        }
      }
    }
  }

  const position = cursorPosition(cursorFrom, cursorTo, cursorStart, t);
  const clickProgress = clickAt !== null && t >= clickAt && t <= clickAt + 0.45 ? (t - clickAt) / 0.45 : null;

  const sceneStartTime = cues[blockStart].start;
  const sceneProgress = easeOutCubic(clamp01((t - sceneStartTime) / (TIMING.sceneFadeMs / 1000)));

  const highlight = cue.highlight
    ? { target: cue.highlight, strength: easeOutCubic(clamp01((t - cue.start - (cueIndex === blockStart ? 0.3 : 0)) / 0.25)) }
    : null;

  return {
    cueIndex,
    cue,
    sceneId: cue.scene,
    scene,
    sceneProgress,
    revealed,
    typed,
    typingTarget,
    sent,
    streamed,
    cursor: { ...position, visible: scene.type === "browser", clickProgress },
    highlight,
    key,
    speaking: t >= cue.audioStart && t < cue.audioEnd,
    subtitleVisible: t >= cue.audioStart - 0.05,
  };
}

function cursorPosition(from: { x: number; y: number }, to: { x: number; y: number }, start: number, t: number) {
  if (!Number.isFinite(start)) return to;
  const progress = easeOutCubic(clamp01((t - start) / (TIMING.cursorTravelMs / 1000)));
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
}
