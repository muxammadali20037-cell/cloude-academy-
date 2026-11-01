/**
 * WebVTT subtitr fayli: har bir gap ovoz boshlangan paytdan qadam oxirigacha
 * ko'rinadi (o'qib ulgurish uchun gapdan keyingi pauzada ham turadi).
 */
import type { Timeline } from "./schema.ts";

function stamp(seconds: number) {
  const totalMs = Math.round(seconds * 1000);
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const msPart = totalMs % 1000;
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(msPart, 3)}`;
}

/** Uzun gapni ikki qatorga bo'ladi (taxminan teng, so'z chegarasida). */
export function splitSubtitleLines(text: string, maxLine = 64) {
  if (text.length <= maxLine) return [text];
  const words = text.split(" ");
  let best = [text];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    const diff = Math.abs(first.length - second.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [first, second];
    }
  }
  return best;
}

export function toWebVtt(timeline: Pick<Timeline, "cues">) {
  const blocks = timeline.cues.map((cue) =>
    [cue.id, `${stamp(cue.audioStart)} --> ${stamp(cue.end)}`, ...splitSubtitleLines(cue.text)].join("\n"),
  );
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

export { stamp as vttTimestamp };
