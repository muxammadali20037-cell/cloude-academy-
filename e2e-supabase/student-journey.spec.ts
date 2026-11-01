import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForOtp } from "./mailbox";

/**
 * Haqiqiy talaba yo'li — to'liq Supabase (auth, baza, RLS, pochta) bilan:
 * ro'yxatdan o'tish → kod → dashboard → dars → tugatish → progress → chiqish.
 */

const SHOTS = "test-results/screens";

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

async function signUp(page: Page, email: string) {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/kirish\?next=%2Fapp/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kod olish" }).click();
  await expect(page).toHaveURL(/\/tasdiqlash$/);
  const code = await waitForOtp(email);
  await page.getByLabel("Kod").fill(code);
  await page.getByRole("button", { name: "Tasdiqlash" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("ochiq sahifalar bazadagi haqiqiy dasturni ko'rsatadi", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("6 ta daraja, 90 ta dars, oʻzbek tilida")).toBeVisible();
  await expect(page.getByText("Narxlar ochilish arafasida eʼlon qilinadi")).toBeVisible();
  await expectAccessible(page);
  await shot(page, "landing");

  await page.goto("/dastur");
  await expect(page.getByText("Claude asoslari").first()).toBeVisible();
  await expect(page.getByText("Real loyihalar").first()).toBeVisible();

  await page.goto("/bepul-dars");
  const free = page.getByRole("link", { name: /Claude nima\?/ });
  await expect(free).toBeVisible();
  await free.click();
  await expect(page.getByRole("heading", { level: 1, name: "Claude nima?" })).toBeVisible();
  await page.getByRole("button", { name: "Keyingi bosqich" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Amaliy vazifa" })).toBeVisible();
  await expectAccessible(page);
  await shot(page, "free-lesson-visitor");
});

test("talaba: ro'yxat → dashboard → dars → tugatish → progress", async ({ page }) => {
  const email = `talaba-${Date.now()}-${test.info().project.name}@test.uz`;
  await signUp(page, email);

  // Yangi talaba: hammasi 0.
  await expect(page.getByRole("heading", { level: 1, name: "Xush kelibsiz" })).toBeVisible();
  await expect(page.getByText("0 / 90 dars")).toBeVisible();
  await expect(page.getByRole("img", { name: "Umumiy progress: 0%" })).toBeVisible();
  await expectAccessible(page);
  await shot(page, "dashboard-new");

  // Ism (sertifikat uchun)
  await page.getByRole("link", { name: "Ismni kiritish" }).click();
  await page.getByLabel("Toʻliq ism").fill("Test Talaba");
  await page.getByRole("button", { name: "Saqlash" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saqlandi" })).toBeVisible();

  // Dashboard → bepul dars
  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1, name: "Salom, Test" })).toBeVisible();
  await page.getByRole("link", { name: "Darsni boshlash" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Claude nima?" })).toBeVisible();

  // Bosqichlar ketma-ket
  await page.getByRole("button", { name: "Keyingi bosqich" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Amaliy vazifa" })).toBeVisible();
  await page.getByRole("button", { name: "Keyingi bosqich" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Keyingi qadam" })).toBeVisible();
  await expectAccessible(page);
  await shot(page, "lesson-last-step");
  await page.getByRole("button", { name: "Darsni tugatish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Dars tugatildi" })).toBeVisible();

  // Progress yangilandi
  await page.goto("/app");
  await expect(page.getByText("1 / 90 dars")).toBeVisible();
  await expect(page.getByRole("img", { name: "Umumiy progress: 1%" })).toBeVisible();
  await shot(page, "dashboard-after-lesson");

  // Kurs xaritasi: tugatilgan dars belgilangan, pullik dars yopiq
  await page.goto("/app/kurs");
  await expect(page.getByText("Tugatildi").first()).toBeVisible();
  await expect(page.getByText("Kursda").first()).toBeVisible();
  await expectAccessible(page);
  await shot(page, "course-map");

  // Chiqish: kabinet yopiladi
  await page.goto("/app/profil");
  await page.getByRole("main").getByRole("button", { name: "Chiqish" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/kirish/);
});

test("noto'g'ri kod tushunarli xato beradi", async ({ page }) => {
  const email = `xato-${Date.now()}-${test.info().project.name}@test.uz`;
  await page.goto("/kirish");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kod olish" }).click();
  await expect(page).toHaveURL(/\/tasdiqlash$/);
  await waitForOtp(email);
  await page.getByLabel("Kod").fill("000000");
  await page.getByRole("button", { name: "Tasdiqlash" }).click();
  await expect(page.getByText(/Kod notoʻgʻri yoki muddati oʻtgan/)).toBeVisible();
});
