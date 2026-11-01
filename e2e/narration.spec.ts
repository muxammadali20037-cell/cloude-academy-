import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator } from "@playwright/test";

/**
 * Ovozli dars pleyeri haqiqiy brauzerda: haqiqiy MP3 yuklanadi va ijro etiladi,
 * animatsiya audio vaqtiga bog'langan, boshqaruvlar audio elementini o'zgartiradi.
 */

type Cue = { id: string; text: string; start: number; end: number; audioStart: number; audioEnd: number };
const timeline = JSON.parse(readFileSync(resolve(process.cwd(), "content/narration/l1-m1-01/timeline.json"), "utf8")) as {
  audio: { src: string } | null;
  cues: Cue[];
};
const cueAt = (t: number) => [...timeline.cues].reverse().find((cue) => cue.start <= t)!;

const audioTime = (audio: Locator) => audio.evaluate((element: HTMLAudioElement) => element.currentTime);

test.describe("ovozli dars pleyeri", () => {
  test.skip(!timeline.audio, "bu dars uchun ovoz hali yaratilmagan");

  test("haqiqiy audio ijro etiladi, animatsiya va subtitr ovoz bilan bir vaqtda", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));

    await page.goto("/design-system#ovozli-dars");
    const player = page.getByRole("region", { name: "Ovozli dars: Claude nima?" });
    const audio = player.getByTestId("narration-audio");
    const stage = player.locator("[data-cue]");
    const subtitle = player.getByTestId("narration-subtitle");

    // Audio oldindan to'liq yuklanadi.
    await expect(player).toHaveAttribute("data-status", "ready", { timeout: 30_000 });
    expect(await audio.evaluate((element: HTMLAudioElement) => element.duration)).toBeGreaterThan(30);

    await player.getByRole("button", { name: "Darsni boshlash" }).click();
    await expect.poll(() => audioTime(audio), { timeout: 10_000 }).toBeGreaterThan(1.5);
    await expect(subtitle).toHaveText(timeline.cues[0].text);
    expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);

    // Tezlik audio elementiga o'tadi.
    await player.getByLabel("Tezlik").selectOption("1.5");
    expect(await audio.evaluate((element: HTMLAudioElement) => element.playbackRate)).toBe(1.5);

    // Ovozni o'chirish — dars to'xtamaydi, faqat ovoz o'chadi.
    await player.getByRole("button", { name: "Oʻqituvchi ovozi" }).click();
    expect(await audio.evaluate((element: HTMLAudioElement) => element.muted)).toBe(true);
    const before = await audioTime(audio);
    await expect.poll(() => audioTime(audio)).toBeGreaterThan(before + 0.3);
    await player.getByRole("button", { name: "Oʻqituvchi ovozi" }).click();
    expect(await audio.evaluate((element: HTMLAudioElement) => element.muted)).toBe(false);

    // Joriy tushuntirishni qayta: audio shu gap boshiga qaytadi.
    const current = cueAt(await audioTime(audio));
    await player.getByRole("button", { name: "Joriy tushuntirishni qayta eshitish" }).click();
    expect(await audioTime(audio)).toBeLessThan(current.start + 0.5);

    // Pauza.
    await player.getByRole("button", { name: "Pauza" }).click();
    expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);

    // Sinxronlik: istalgan joyga o'tilganda sahna aynan shu vaqtdagi qadamni ko'rsatadi.
    for (const id of ["c09", "c15", "c20"]) {
      const cue = timeline.cues.find((item) => item.id === id)!;
      await player.getByLabel("Dars vaqti").fill(String(Math.round((cue.audioStart + 0.4) * 10) / 10));
      await expect(stage).toHaveAttribute("data-cue", id);
      expect(Math.abs((await audioTime(audio)) - (cue.audioStart + 0.4))).toBeLessThan(0.15);
      await expect(subtitle).toHaveText(cue.text);
    }

    // Subtitrni o'chirish.
    await player.getByRole("button", { name: "Subtitr" }).click();
    await expect(subtitle).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("klaviatura: K — ijro/pauza, → — keyingi gap", async ({ page }) => {
    await page.goto("/design-system#ovozli-dars");
    const player = page.getByRole("region", { name: "Ovozli dars: Claude nima?" });
    await expect(player).toHaveAttribute("data-status", "ready", { timeout: 30_000 });
    const stage = player.locator("[data-cue]");

    await player.getByRole("button", { name: "Boshidan koʻrish" }).focus();
    await page.keyboard.press("k");
    await expect(player.getByRole("button", { name: "Pauza" })).toBeVisible();
    await page.keyboard.press("k");
    await expect(player.getByRole("button", { name: "Ijro etish" })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(stage).toHaveAttribute("data-cue", "c03");
  });
});
