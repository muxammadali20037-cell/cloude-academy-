# Claude Academy

Claude'ni o'zbek tilida amaliyot orqali o'rgatadigan pullik ta'lim platformasi.
Mustaqil loyiha — Anthropic bilan bog'liq emas. "Claude Academy" — ishchi nom; yakuniy
brend `src/config/brand.ts` faylida bir joyda o'zgartiriladi.

To'liq reja (arxitektura, sahifalar, database, AI, to'lov, roadmap):
[Phase 1 hujjati](https://claude.ai/artifact/4kxDzfK5DYR5vTHLxGR3tL).

## Hozirgi holat

| Faza | Holat |
| --- | --- |
| 1 · Audit va reja | Tayyor |
| 2 · Dizayn tizimi | Tayyor — `/design-system` |
| 3 · Asosiy mahsulot | Tayyor — baza, email kod bilan kirish, landing, dashboard, kurs xaritasi, dars sahifasi, progress |
| 7 · Admin va CMS | Keyingi |

Ishlaydigan qismlar: kurs dasturi (6 daraja, 90 dars — hozircha nomlari), ro'yxatdan
o'tish va kirish, talaba kabineti, dars bosqichlari, tugatish shartlari, o'qish vaqti va
ketma-ket kunlar. Darslar mazmuni yozilib, tekshirilgach nashr qilinadi.

Ulanmagan servislar (Claude API, Click, Payme, Telegram, video, TTS, SMS) `NOT CONFIGURED`
deb ko'rsatiladi. Hech qayerda soxta ma'lumot, soxta narx yoki soxta video yo'q.

## Ishga tushirish

Talab: Node.js 22.12 yoki yangiroq.

```bash
npm install
cp .env.example .env.local   # Supabase manzili va publishable kaliti
npm run dev                  # http://localhost:3000
```

## Buyruqlar

| Buyruq | Nima qiladi |
| --- | --- |
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route turlarini yaratadi va TypeScript tekshiruvi |
| `npm run test` | UI testlari + baza testlari (barcha migratsiyalar va RLS qoidalari haqiqiy PostgreSQL'da — PGlite) |
| `npm run test:e2e` | Brauzer testlari (baza ulanmagan holat): ikki tema, desktop va mobil, WCAG 2.2 AA. Avval `npm run build` |
| `npm run check` | Lint + typecheck + test + build birdaniga |

GitHub Actions har bir push'da ikki ishni bajaradi (`.github/workflows/ci.yml`):

1. **check** — lint, typecheck, barcha testlar, build, e2e.
2. **e2e-supabase** — Docker'da to'liq mahalliy Supabase (`supabase start`), migratsiyalar,
   test darslari (`e2e-supabase/fixtures.sql`) va haqiqiy talaba yo'li: ro'yxatdan o'tish →
   pochtadan kod → dashboard → dars → tugatish → progress → chiqish. Skrinshotlar artefakt
   sifatida saqlanadi.

## Tuzilma

```
supabase/
  migrations/             Baza sxemasi, RLS, server funksiyalari, kurs dasturi
  templates/              Kirish kodi xati (bulutda Supabase paneliga ham kiritiladi)
  config.toml             Mahalliy Supabase (CI) sozlamalari
src/
  proxy.ts                Har so'rovda sessiyani yangilaydi, /app'ni himoyalaydi
  app/
    (public)/             Landing, /dastur, /narxlar, /bepul-dars
    (auth)/               /kirish, /tasdiqlash va kirish amallari
    app/                  Talaba kabineti: dashboard, kurs, dars, profil
    design-system/        Barcha komponentlar namunasi
  components/
    ui/                   Asosiy komponentlar
    learning/             ProgressRing, LessonPath, LessonPlayer, CurriculumView, Markdown...
    marketing/            Landing bo'limlari, jonli mashq, tariflar, FAQ
    layout/, system/, theme/, brand/
  config/                 Brend, imkoniyatlar holati
  lib/
    supabase/             Klientlar, turlar, proxy sessiyasi
    data/                 Ma'lumotlar qatlami (har doim halol holat qaytaradi)
    auth.ts               Joriy foydalanuvchi (token imzosi tekshiriladi)
tests/db/                 RLS testlari va Supabase shim
e2e/                      Brauzer testlari (ulanmagan holat)
e2e-supabase/             To'liq yo'l testlari (CI)
```

## Texnik qarorlar

| Qaror | Sabab |
| --- | --- |
| Next.js 16.4, React 19.3, Cache Components o'chirilgan | Sahifalar asosan talabaga xos; oddiy server rendering soddaroq va ishonchliroq |
| TypeScript 6.0.3 (7 emas) | ESLint'ning TypeScript qoidalari hozircha `<6.1` versiyani qo'llaydi |
| Supabase Auth, email kod (parolsiz) | Parol yo'q — unutilmaydi va tarqatilmaydi; telefon kodi SMS provayder ulangach |
| Progress faqat baza funksiyalari orqali | Talaba qadam o'tkazib yubora olmaydi yoki darsni shartlarsiz tugata olmaydi |
| RLS testlari PGlite'da | Har bir migratsiya va qoida haqiqiy PostgreSQL'da, Docker'siz, soniyalarda tekshiriladi |
| Tailwind CSS 4, standart ranglar o'chirilgan | Faqat platforma palitrasi; komponentlar semantik tokenlardan rang oladi |
| Onest shrifti (npm orqali) | O'zbek lotin harflari (oʻ, gʻ, ʼ) va kirill bor |
| Markdown xom HTML'siz | Dars matnidagi kod hech qachon bajarilmaydi (XSS himoyasi) |

## Bulutdagi Supabase sozlamalari (qo'lda, bir marta)

1. **Authentication → URL Configuration:** Site URL — sayt domeni; Redirect URLs — domen va Vercel preview manzillari.
2. **Authentication → Emails → Templates:** "Magic link" va "Confirm signup" shablonlariga
   `supabase/templates/magic_link.html` matnini qo'ying (unda `{{ .Token }}` — 6 xonali kod).
3. **Authentication → Emails → SMTP Settings:** o'z SMTP xizmatingiz (masalan, Resend). Supabase'ning
   standart pochtasi faqat loyiha a'zolariga va soatiga bir necha xat yuboradi.

## Xavfsizlik qoidalari

- Maxfiy kalitlar faqat serverda. `NEXT_PUBLIC_` o'zgaruvchilariga maxfiy qiymat yozilmaydi.
- `.env.local` gitga yuklanmaydi; namunasi — `.env.example` (test u bilan kod mosligini tekshiradi).
- Har bir jadvalda RLS; talaba faqat o'z ma'lumotini ko'radi, kirish huquqini o'zi bera olmaydi.
- Kirishdan keyingi qaytish manzili tekshiriladi (tashqi saytga yo'naltirish mumkin emas).
- Xavfsizlik sarlavhalari: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
