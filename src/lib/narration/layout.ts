/**
 * Sahna elementlarining joylashuvi (mantiqiy 960×540 koordinatalarda).
 *
 * Bitta manba: sahna chizilganda ham, kursor va ajratib ko'rsatish ramkasi
 * hisoblanganda ham shu o'lchamlar ishlatiladi. Shuning uchun kursor har doim
 * aynan tugma ustiga boradi — ekran o'lchamidan qat'i nazar.
 */
import { STAGE } from "./constants.ts";
import type { ListScene, Scene } from "./schema.ts";

export type Rect = { x: number; y: number; w: number; h: number };

export const PAD_X = 72;

export const TITLE_LAYOUT = {
  eyebrow: { x: PAD_X, y: 150, w: 816, h: 32 },
  title: { x: PAD_X, y: 196, w: 816, h: 92 },
  lead: { x: PAD_X, y: 304, w: 760, h: 72 },
} satisfies Record<string, Rect>;

export const BROWSER_LAYOUT = {
  frame: { x: 40, y: 26, w: 880, h: 488 },
  toolbar: { x: 40, y: 26, w: 880, h: 46 },
  address: { x: 150, y: 35, w: 420, h: 28 },
  page: { x: 40, y: 72, w: 880, h: 442 },
  notice: { x: 290, y: 88, w: 380, h: 36 },
  message: { x: 440, y: 140, w: 440, h: 92 },
  answer: { x: 80, y: 246, w: 720, h: 160 },
  input: { x: 80, y: 430, w: 744, h: 60 },
  send: { x: 836, y: 438, w: 44, h: 44 },
} satisfies Record<string, Rect>;

const LIST_HEADING: Rect = { x: PAD_X, y: 56, w: 816, h: 52 };
const LIST_TOP = 132;
const LEAD_HEIGHT = 76;
const ITEM_HEIGHT = 56;
const ITEM_GAP = 14;

export function listLayout(scene: ListScene): Record<string, Rect> {
  const rects: Record<string, Rect> = { heading: LIST_HEADING };
  let y = LIST_TOP;
  for (const item of scene.items) {
    const h = item.tone === "lead" ? LEAD_HEIGHT : ITEM_HEIGHT;
    rects[item.id] = { x: PAD_X, y, w: 816, h };
    y += h + ITEM_GAP;
  }
  return rects;
}

export function sceneLayout(scene: Scene): Record<string, Rect> {
  switch (scene.type) {
    case "title":
      return TITLE_LAYOUT;
    case "list":
      return listLayout(scene);
    case "browser":
      return BROWSER_LAYOUT;
  }
}

/** Kursorning dam olish joyi (sahna boshida). */
export const CURSOR_REST = { x: STAGE.width - 120, y: STAGE.height - 90 };

/** Element markazi — kursor shu nuqtaga boradi. */
export function centerOf(rect: Rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

/** Ro'yxat sahnasi ekranga sig'adimi (pastki chegaradan chiqmaydi). */
export function listFits(scene: ListScene) {
  const rects = Object.values(listLayout(scene));
  return rects.every((rect) => rect.y + rect.h <= STAGE.height - 24);
}
