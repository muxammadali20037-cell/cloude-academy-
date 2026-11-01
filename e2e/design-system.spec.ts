import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, "sahifa ekrandan kengroq bo'lmasligi kerak").toBeLessThanOrEqual(clientWidth);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`dizayn tizimi — ${scheme} tema`, () => {
    test.use({ colorScheme: scheme });

    test("xatosiz ochiladi, ekrandan chiqmaydi va accessibility skanidan o'tadi", async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto("/design-system");
      await expect(page.getByRole("heading", { level: 1, name: "Dizayn tizimi" })).toBeVisible();

      // Tema qurilma sozlamasiga mos qo'yilgan.
      const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      expect(isDark).toBe(scheme === "dark");

      await expectNoHorizontalOverflow(page);

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} ta element`);
      expect(summary, "WCAG AA buzilishlari bo'lmasligi kerak").toEqual([]);

      expect(errors, "brauzer konsolida xato bo'lmasligi kerak").toEqual([]);
    });
  });
}

test("tema tanlovi qayta yuklangandan keyin ham saqlanadi", async ({ page }) => {
  await page.goto("/design-system");
  const toggle = page.getByRole("radiogroup", { name: "Tema" }).first();
  await toggle.getByRole("radio", { name: "Qorongʻi tema" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await toggle.getByRole("radio", { name: "Yorugʻ tema" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("namuna mashq: xato javob → izoh → o'xshash mashq", async ({ page }) => {
  await page.goto("/design-system#mashq");
  const exercise = page.locator("#mashq");
  const check = exercise.getByRole("button", { name: "Tekshirish" });
  await expect(check).toBeDisabled();

  await exercise.getByRole("radio", { name: /Hujjatning oʻrtasida/ }).click();
  await check.click();
  const feedback = exercise.getByRole("status").filter({ hasText: "Notoʻgʻri javob" });
  await expect(feedback).toBeVisible();
  await expect(feedback.getByText("Hujjatdan keyin, eng oxirida")).toBeVisible();

  await exercise.getByRole("button", { name: "Oʻxshash mashq" }).click();
  await expect(exercise.getByText("Savol 2, jami 2")).toBeVisible();
});

test("klaviatura bilan boshqarish: fokus ko'rinadi", async ({ page }) => {
  await page.goto("/design-system");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  expect(outline).not.toBe("none");
});

test("bosh sahifa ochiladi va dizayn tizimiga olib boradi", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Platforma qurilmoqda" })).toBeVisible();
  await page.getByRole("link", { name: "Dizayn tizimini koʻrish" }).click();
  await expect(page).toHaveURL(/\/design-system$/);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});
