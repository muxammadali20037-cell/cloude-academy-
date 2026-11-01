import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listFits, BROWSER_LAYOUT, centerOf } from "./layout";
import { scriptSchema, timelineSchema, type NarrationScript } from "./schema";
import { scriptHash } from "./script-hash";
import { applyLexicon, characterErrorRate, normalizeForComparison, speechChunks, spokenText } from "./speech-text";
import { stageStateAt } from "./stage-state";
import { buildTimeline, cueIndexAt, missingPurposes, timelineProblems } from "./timeline";
import { latinToCyrillic } from "./translit";
import { splitSubtitleLines, toWebVtt } from "./vtt";

const root = process.cwd();
const rawScript = JSON.parse(readFileSync(resolve(root, "content/narration/l1-m1-01/script.json"), "utf8"));
const script: NarrationScript = scriptSchema.parse(rawScript);

describe("transliteratsiya (lotin → kirill)", () => {
  it.each([
    ["oʻzbek", "ўзбек"],
    ["gʻoya", "ғоя"],
    ["o'qish", "ўқиш"],
    ["shahar", "шаҳар"],
    ["choy", "чой"],
    ["yoʻl", "йўл"],
    ["yangi yuz yer", "янги юз ер"],
    ["eshik", "эшик"],
    ["poeziya", "поэзия"],
    ["maʼlumot", "маълумот"],
    ["sunʼiy intellekt", "сунъий интеллект"],
    ["kompyuter", "компютер"],
    ["Enter tugmasi", "энтер тугмаси"],
    ["klod nuqta ey ay", "клод нуқта эй ай"],
  ])("%s → %s", (latin, cyrillic) => {
    expect(latinToCyrillic(latin)).toBe(cyrillic);
  });
});

describe("talaffuz lug'ati va bo'laklash", () => {
  it("inglizcha nomlar o'zbekcha o'qiladi, qo'shimcha saqlanadi", () => {
    expect(applyLexicon("Bu yerga claude.ai deb yozamiz — bu Claudeʼning rasmiy sayti.", script.lexicon)).toBe(
      "Bu yerga klod nuqta ey ay deb yozamiz — bu Klodning rasmiy sayti.",
    );
    expect(applyLexicon("Anthropic kompaniyasi, Claudeʼdan soʻrang", script.lexicon)).toBe(
      "Antropik kompaniyasi, Kloddan soʻrang",
    );
  });

  it("so'z ichidagi chiziqcha o'qiladigan bo'shliqqa aylanadi", () => {
    expect(spokenText("Claude uni qatorma-qator yozib chiqadi.", script.lexicon)).toBe("Klod uni qatorma qator yozib chiqadi.");
  });

  it("gaplar va vergullar pauzalarga ajraladi, bitta so'zli bo'lak qo'shiladi", () => {
    expect(speechChunks("Keling, amalda koʻramiz. Eng oson yoʻl — brauzer: hech narsa oʻrnatish shart emas.")).toEqual([
      { text: "Keling amalda koʻramiz", pauseAfterMs: 420 },
      { text: "Eng oson yoʻl", pauseAfterMs: 200 },
      { text: "brauzer hech narsa oʻrnatish shart emas", pauseAfterMs: 0 },
    ]);
    expect(speechChunks("Salom! Bu darsda boshlaymiz.")).toEqual([
      { text: "Salom", pauseAfterMs: 420 },
      { text: "Bu darsda boshlaymiz", pauseAfterMs: 0 },
    ]);
  });
});

describe("ovozni matn bilan solishtirish", () => {
  it("lotin va kirill yozuvi bir xil deb solishtiriladi", () => {
    const a = normalizeForComparison("Oʻng tomondagi yuborish tugmasini bosamiz.", latinToCyrillic);
    const b = normalizeForComparison("Ўнг томондаги юбориш тугмасини босамиз", latinToCyrillic);
    expect(a).toBe(b);
    expect(characterErrorRate(a, b)).toBe(0);
  });

  it("xato ulushi to'g'ri hisoblanadi", () => {
    expect(characterErrorRate("салом", "салом")).toBe(0);
    expect(characterErrorRate("салом", "салим")).toBeCloseTo(0.2);
    expect(characterErrorRate("салом", "")).toBe(1);
  });
});

describe("ssenariy tekshiruvi", () => {
  it("1-dars ssenariysi to'g'ri va ro'yxatlar sahnaga sig'adi", () => {
    for (const scene of Object.values(script.scenes)) {
      if (scene.type === "list") expect(listFits(scene)).toBe(true);
    }
  });

  it("noto'g'ri element, harakatsiz gap va raqam rad etiladi", () => {
    const broken = structuredClone(rawScript);
    broken.cues[0].actions = [{ do: "reveal", target: "yoq" }];
    broken.cues[1].actions = [];
    delete broken.cues[1].highlight;
    broken.cues[2].text = "Bizda 3 ta qadam bor.";
    const result = scriptSchema.safeParse(broken);
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((issue) => issue.message).join("\n");
    expect(messages).toContain('"yoq" yo\'q');
    expect(messages).toContain("kamida bitta harakat");
    expect(messages).toContain("raqam bo'lmasin");
  });

  it("aytiladigan matnda raqam yo'q (TTS raqamni noto'g'ri o'qimasligi uchun)", () => {
    for (const cue of script.cues) expect(spokenText(cue.text, script.lexicon)).not.toMatch(/\d/);
  });
});

describe("vaqt shkalasi", () => {
  const estimated = buildTimeline({ script, scriptHash: scriptHash(script), speechSeconds: null, audio: null, subtitles: null });

  it("qoidalar bajariladi: ketma-ketlik, ovoz ustma-ust tushmaydi, avval ko'rsatiladi keyin aytiladi", () => {
    expect(timelineProblems(estimated)).toEqual([]);
  });

  it("darsda beshala savolga javob bor: nima, nega, qayerga, natija, xato", () => {
    expect(missingPurposes(estimated)).toEqual([]);
  });

  it("gap uzunligi haqiqiy audio bo'yicha hisoblanadi", () => {
    const durations = Object.fromEntries(script.cues.map((cue) => [cue.id, 2.5]));
    const timeline = buildTimeline({ script, scriptHash: "a".repeat(64), speechSeconds: durations, audio: null, subtitles: null });
    expect(timelineProblems(timeline)).toEqual([]);
    for (const cue of timeline.cues) expect(cue.audioEnd - cue.audioStart).toBeCloseTo(2.5, 3);
    // Birinchi gap: sahna paydo bo'ladi, uchta element ketma-ket chiqadi, keyin gapiriladi.
    const first = timeline.cues[0];
    expect(first.audioStart).toBeGreaterThanOrEqual(Math.max(...first.actions.map((a) => a.visibleAt)));
  });

  it("audio uzunligi yetishmasa, xato beradi", () => {
    expect(() => buildTimeline({ script, scriptHash: "a".repeat(64), speechSeconds: {}, audio: null, subtitles: null })).toThrow(
      /audio uzunligi yo'q/,
    );
  });

  it("vaqt bo'yicha qadam topiladi", () => {
    const cues = [{ start: 0 }, { start: 2 }, { start: 5 }];
    expect(cueIndexAt(cues, -1)).toBe(0);
    expect(cueIndexAt(cues, 2)).toBe(1);
    expect(cueIndexAt(cues, 4.99)).toBe(1);
    expect(cueIndexAt(cues, 99)).toBe(2);
  });
});

describe("sahna holati vaqtga bog'liq", () => {
  const timeline = buildTimeline({ script, scriptHash: scriptHash(script), speechSeconds: null, audio: null, subtitles: null });
  const cue = (id: string) => timeline.cues.find((item) => item.id === id)!;

  it("boshida hech narsa ko'rinmaydi, gap boshlanganda sarlavha ko'rinib bo'lgan", () => {
    const start = stageStateAt(timeline, 0);
    expect(start.sceneId).toBe("intro");
    expect(start.revealed.title ?? 0).toBe(0);
    expect(start.subtitleVisible).toBe(false);

    const speaking = stageStateAt(timeline, cue("c01").audioStart + 0.01);
    expect(speaking.speaking).toBe(true);
    expect(speaking.revealed.title).toBeGreaterThan(0.6);
  });

  it("manzil qatoriga matn harfma-harf yoziladi, Enter bosilgach sahifa ochiladi", () => {
    const typing = cue("c09").actions[0];
    const middle = stageStateAt(timeline, (typing.start + typing.end) / 2);
    expect(middle.typed.address.length).toBeGreaterThan(0);
    expect(middle.typed.address.length).toBeLessThan("claude.ai".length);
    expect(middle.typingTarget).toBe("address");

    const opened = stageStateAt(timeline, cue("c10").audioStart);
    expect(opened.typed.address).toBe("claude.ai");
    expect(opened.key?.label).toBe("Enter");
    expect(opened.revealed.page).toBeGreaterThan(0);
  });

  it("kursor yuborish tugmasiga boradi, xabar yuboriladi va maydon tozalanadi", () => {
    const click = cue("c15").actions[0];
    const clicked = stageStateAt(timeline, click.visibleAt + 0.05);
    const send = centerOf(BROWSER_LAYOUT.send);
    expect(clicked.cursor.x).toBeCloseTo(send.x, 0);
    expect(clicked.cursor.y).toBeCloseTo(send.y, 0);
    expect(clicked.cursor.clickProgress).not.toBeNull();

    const after = stageStateAt(timeline, cue("c16").audioStart);
    expect(after.sent).toHaveLength(1);
    expect(after.sent[0]).toContain("Men buxgalterman.");
    expect(after.typed.input).toBe("");
    expect(after.streamed.answer).toBeGreaterThan(0);
  });

  it("orqaga o'tilganda sahna avvalgi holatiga qaytadi (sof funksiya)", () => {
    const later = stageStateAt(timeline, cue("c17").end - 0.01);
    const earlier = stageStateAt(timeline, cue("c08").audioStart);
    expect(later.sent).toHaveLength(1);
    expect(earlier.sent).toHaveLength(0);
    expect(earlier.typed.address ?? "").toBe("");
    expect(earlier.revealed.page ?? 0).toBe(0);
  });

  it("yangi sahnada oldingi sahna holati qolmaydi", () => {
    const fix = stageStateAt(timeline, cue("c19").audioStart);
    expect(fix.sceneId).toBe("fix");
    expect(fix.sent).toEqual([]);
    expect(fix.cursor.visible).toBe(false);
    expect(fix.highlight?.target).toBe("reload");
  });
});

describe("repodagi tayyor ovozli darslar", () => {
  const dir = resolve(root, "content/narration");
  const keys = readdirSync(dir).filter((name) => existsSync(resolve(dir, name, "timeline.json")));

  it("kamida bitta dars bor", () => expect(keys.length).toBeGreaterThan(0));

  for (const key of keys) {
    describe(key, () => {
      const timeline = timelineSchema.parse(JSON.parse(readFileSync(resolve(dir, key, "timeline.json"), "utf8")));
      const lessonScript = scriptSchema.parse(JSON.parse(readFileSync(resolve(dir, key, "script.json"), "utf8")));

      it("audio va vaqtlar aynan joriy ssenariydan yaratilgan", () => {
        expect(timeline.scriptHash).toBe(scriptHash(lessonScript));
        expect(timeline.cues.map((cue) => cue.text)).toEqual(lessonScript.cues.map((cue) => cue.text));
      });

      it("vaqt shkalasi qoidalari bajariladi", () => {
        expect(timelineProblems(timeline)).toEqual([]);
      });

      it("subtitr fayli vaqt shkalasiga mos", () => {
        expect(timeline.subtitles).not.toBeNull();
        const vtt = readFileSync(resolve(root, "public", timeline.subtitles!.split("?")[0].slice(1)), "utf8");
        expect(vtt).toBe(toWebVtt(timeline));
      });

      it("audio fayl mavjud va hajmi yozilganiga teng", () => {
        if (!timeline.audio) return;
        const file = resolve(root, "public", timeline.audio.src.split("?")[0].slice(1));
        expect(statSync(file).size).toBe(timeline.audio.bytes);
      });

      it("tijoriy bo'lmagan sinov ovozi tasdiqlangan darsga qo'yilmaydi", () => {
        if (timeline.audio && !timeline.audio.commercialUse) expect(lessonScript.status).not.toBe("approved");
      });
    });
  }
});

describe("subtitr (WebVTT)", () => {
  it("uzun gap ikki teng qatorga bo'linadi", () => {
    const lines = splitSubtitleLines("Eng muhimi: Claude ham xato qilishi mumkin. Raqam, sana va nomlarni rasmiy manbadan tekshiring.");
    expect(lines).toHaveLength(2);
    expect(Math.abs(lines[0].length - lines[1].length)).toBeLessThan(20);
  });

  it("vaqt belgilari to'g'ri formatda", () => {
    const vtt = toWebVtt({
      cues: [{ id: "c01", purpose: "what", scene: "a", text: "Salom!", start: 0, end: 2.5, audioStart: 0.62, audioEnd: 1.8, actions: [] }],
    });
    expect(vtt).toBe("WEBVTT\n\nc01\n00:00:00.620 --> 00:00:02.500\nSalom!\n");
  });
});
