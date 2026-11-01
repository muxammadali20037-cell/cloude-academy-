/**
 * O'zbek lotin → kirill transliteratsiyasi.
 *
 * Kerakligi: ochiq sinov modeli (Meta MMS, uzb-script_cyrillic) faqat kirill
 * harflarini o'qiydi. Ishlab chiqarishdagi provayder (Azure) lotin matnni
 * to'g'ridan-to'g'ri oladi.
 *
 * Qoidalar: oʻ→ў, gʻ→ғ, sh→ш, ch→ч, yo→ё, yu→ю, ya→я, ye→е,
 * so'z boshida va unlidan keyin e→э, tutuq (ʼ)→ъ.
 */

const SINGLE: Record<string, string> = {
  a: "а", b: "б", c: "к", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л",
  m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "х",
  y: "й", z: "з",
};

/** oʻ / gʻ dagi belgi: toʻgʻri ʻ (U+02BB) va klaviaturadagi o'rinbosarlari. */
const OKINA = new Set(["ʻ", "‘", "’", "`", "'"]);
/** Tutuq belgisi (U+02BC). */
const TUTUQ = "ʼ";
const VOWEL_SOUNDS = new Set(["a", "e", "i", "o", "u", "oʻ", "ya", "yo", "yu", "ye"]);
const Y_VOWELS: Record<string, string> = { o: "ё", a: "я", u: "ю", e: "е" };

const isLetter = (ch: string | undefined) => ch !== undefined && /\p{L}/u.test(ch);

export function latinToCyrillic(input: string) {
  const text = input.toLowerCase();
  let out = "";
  /** Oldingi tovush (so'z chegarasida — null). "e" ni to'g'ri o'qish uchun kerak. */
  let previous: string | null = null;
  let i = 0;

  const emit = (cyrillic: string, sound: string | null, length: number) => {
    out += cyrillic;
    previous = sound;
    i += length;
  };

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    const afterNext = text[i + 2];

    if ((ch === "o" || ch === "g") && next !== undefined && OKINA.has(next)) {
      emit(ch === "o" ? "ў" : "ғ", ch === "o" ? "oʻ" : "gʻ", 2);
    } else if (ch === "s" && next === "h") {
      emit("ш", "sh", 2);
    } else if (ch === "c" && next === "h") {
      emit("ч", "ch", 2);
    } else if (ch === "y" && next !== undefined && next in Y_VOWELS && !(next === "o" && afterNext !== undefined && OKINA.has(afterNext))) {
      // "yoʻl" — й + ў bo'lib qoladi (yuqoridagi shart), qolganlari bitta harf.
      emit(Y_VOWELS[next], `y${next}`, 2);
    } else if (ch === "e") {
      const wordStart = previous === null;
      const afterVowel = previous !== null && VOWEL_SOUNDS.has(previous);
      emit(wordStart || afterVowel ? "э" : "е", "e", 1);
    } else if (ch === TUTUQ && isLetter(text[i - 1])) {
      emit("ъ", "ʼ", 1);
    } else if (ch in SINGLE) {
      emit(SINGLE[ch], ch, 1);
    } else {
      emit(ch, isLetter(ch) ? ch : null, 1);
    }
  }
  return out;
}
