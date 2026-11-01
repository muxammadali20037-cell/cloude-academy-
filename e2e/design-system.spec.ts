import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Baza ulanmagan holatdagi tekshiruvlar (Supabase kalitlarisiz build).
 * To'liq yo'l (auth, dars, progress) e2e-supabase/ papkasida.
 */

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

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary, "WCAG AA buzilishlari bo'lmasligi kerak").toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} tema`, () => {
    test.use({ colorScheme: scheme });

    for (const path of ["/", "/design-system", "/kirish", "/dastur", "/narxlar", "/bepul-dars"]) {
      test(`${path} xatosiz ochiladi, ekrandan chiqmaydi, WCAG AA`, async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        expect(isDark).toBe(scheme === "dark");
        await expectNoHorizontalOverflow(page);
        await expectAccessible(page);
        expect(errors, "brauzer konsolida xato bo'lmasligi kerak").toEqual([]);
      });
    }
  });
}

test("kabinet himoyalangan: kirmagan foydalanuvchi kirish sahifasiga yo'naltiriladi", async ({ page }) => {
  await page.goto("/app/kurs");
  await expect(page).toHaveURL(/\/kirish\?next=%2Fapp%2Fkurs$/);
  await expect(page.getByText("Kirish tizimi hali ulanmagan", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Kod olish" })).toBeDisabled();
});

test("tasdiqlash sahifasi email kiritilmasdan ochilmaydi", async ({ page }) => {
  await page.goto("/tasdiqlash");
  await expect(page).toHaveURL(/\/kirish$/);
});

test("baza ulanmaganda soxta raqam yoki narx ko'rsatilmaydi", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Kurs dasturi hozircha yuklanmadi")).toBeVisible();
  await expect(page.getByText("Narxlar ochilish arafasida eʼlon qilinadi")).toBeVisible();
  await expect(page.getByText(/ta daraja, \d+ ta dars/)).toHaveCount(0);
});

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

test("landingdagi jonli mashq ishlaydi: xato javob → izoh → o'xshash mashq", async ({ page }) => {
  await page.goto("/");
  const check = page.getByRole("button", { name: "Tekshirish" });
  await expect(check).toBeDisabled();
  await page.getByRole("radio", { name: /Hujjatning oʻrtasida/ }).click();
  await check.click();
  const feedback = page.getByRole("status").filter({ hasText: "Notoʻgʻri javob" });
  await expect(feedback).toBeVisible();
  await expect(feedback.getByText("Hujjatdan keyin, eng oxirida")).toBeVisible();
  await page.getByRole("button", { name: "Oʻxshash mashq" }).click();
  await expect(page.getByText("Savol 2, jami 2")).toBeVisible();
});

test("klaviatura bilan boshqarish: fokus ko'rinadi", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  expect(outline).not.toBe("none");
});

test("mavjud bo'lmagan sahifa o'zbekcha 404 beradi", async ({ page }) => {
  const response = await page.goto("/bunday-sahifa-yoq");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Sahifa topilmadi" })).toBeVisible();
});
