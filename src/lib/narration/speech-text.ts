/**
 * Subtitr matnidan TTS uchun matn tayyorlash.
 *
 * Subtitrda "Claude", "claude.ai" kabi nomlar asl yozilishida qoladi, ovozda esa
 * o'zbekcha o'qiladi ("Klod", "klod nuqta ey ay"). Talaffuz lug'ati ssenariyda.
 */

export type LexiconEntry = { match: string; say: string };

const APOSTROPHES = /[ʻʼ‘’`']/g;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lug'atni qo'llaydi. Uzunroq moslik birinchi ("claude.ai" → "Claude" dan oldin).
 * So'z oxiridagi tutuq belgisi ham olinadi: "Claudeʼning" → "Klodning".
 */
export function applyLexicon(text: string, lexicon: LexiconEntry[]) {
  const entries = [...lexicon].sort((a, b) => b.match.length - a.match.length);
  let result = text;
  for (const entry of entries) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(entry.match)}[ʼ']?(?=\\p{L}|[^\\p{L}\\p{N}]|$)`, "giu");
    result = result.replace(pattern, entry.say);
  }
  return result;
}

/**
 * Ovozga beriladigan matn: lug'at qo'llanadi, so'z ichidagi chiziqcha
 * ("qatorma-qator") bo'shliqqa almashadi, ortiqcha bo'shliqlar olinadi.
 */
export function spokenText(text: string, lexicon: LexiconEntry[]) {
  return applyLexicon(text, lexicon)
    .replace(/(\p{L})-(\p{L})/gu, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Barcha tutuq/qo'shtirnoq variantlarini oddiy ASCII "'" ga keltiradi (Azure uchun). */
export function asciiApostrophes(text: string) {
  return text.replace(APOSTROPHES, "'");
}

export type SpeechChunk = { text: string; pauseAfterMs: number };

const SENTENCE_PAUSE_MS = 420;
const COLON_PAUSE_MS = 300;
const COMMA_PAUSE_MS = 200;

/**
 * Matnni gap va bo'laklarga ajratadi. Tinish belgilarini o'qiy olmaydigan
 * modellar (MMS) uchun pauzalar shu yerda qo'yiladi.
 * Juda qisqa bo'lak (bitta so'z) keyingisiga qo'shiladi — aks holda ohang uziladi.
 */
export function speechChunks(text: string): SpeechChunk[] {
  const raw: SpeechChunk[] = [];
  const pattern = /([^.!?,;:—–]+)([.!?]+|[,;]|:|\s[—–]\s?|$)/g;
  for (const match of text.matchAll(pattern)) {
    const body = match[1].trim();
    if (!body) continue;
    const mark = match[2].trim();
    const pauseAfterMs = /[.!?]/.test(mark) ? SENTENCE_PAUSE_MS : mark === ":" ? COLON_PAUSE_MS : mark ? COMMA_PAUSE_MS : 0;
    raw.push({ text: body, pauseAfterMs });
  }

  const merged: SpeechChunk[] = [];
  for (const chunk of raw) {
    const last = merged[merged.length - 1];
    const lastIsShort = last && last.text.split(/\s+/).length < 2 && last.pauseAfterMs < SENTENCE_PAUSE_MS;
    if (last && lastIsShort) {
      last.text = `${last.text} ${chunk.text}`;
      last.pauseAfterMs = chunk.pauseAfterMs;
    } else {
      merged.push({ ...chunk });
    }
  }
  if (merged.length > 0) merged[merged.length - 1].pauseAfterMs = 0;
  return merged;
}
