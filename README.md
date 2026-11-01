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
| 2 · Dizayn tizimi | Tayyor — `/design-system` sahifasi |
| 3 · Asosiy mahsulot | Keyingi |

Supabase loyihasi yaratilgan (`claude-academy`, Frankfurt), jadvallar 3-fazada qo'shiladi.
Qolgan tashqi servislar (Claude API, Click, Payme, Telegram, video, TTS) hali ulanmagan.
Ularning holati `/design-system` sahifasida haqiqiy muhit o'zgaruvchilaridan ko'rsatiladi
(`NOT CONFIGURED`). Hech qayerda soxta ma'lumot, soxta to'lov yoki soxta video yo'q.

## Ishga tushirish

Talab: Node.js 22.12 yoki yangiroq.

```bash
npm install
cp .env.example .env.local   # kalitlar keyingi fazalarda to'ldiriladi
npm run dev                  # http://localhost:3000
```

## Buyruqlar

| Buyruq | Nima qiladi |
| --- | --- |
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route turlarini yaratadi va TypeScript tekshiruvi |
| `npm run test` | Komponent va mantiq testlari (Vitest) |
| `npm run test:e2e` | Brauzer testlari: ikki tema, desktop va mobil, WCAG 2.2 AA skani (Playwright + axe). Avval `npm run build` |
| `npm run check` | Lint + typecheck + test + build birdaniga |

Mahalliy muhitda tizimdagi Chrome bilan: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome npm run test:e2e`.
GitHub Actions har bir push'da hammasini avtomatik tekshiradi (`.github/workflows/ci.yml`).

## Tuzilma

```
src/
  app/
    layout.tsx            Shriftlar, tema, metadata
    globals.css           Dizayn tokenlari (ranglar, shrift shkalasi, radius, harakat)
    page.tsx              Vaqtinchalik bosh sahifa (landing 3-fazada)
    design-system/        Barcha komponentlar namunasi
  components/
    ui/                   Asosiy komponentlar: Button, Input, Field, Card, Tabs, Dialog...
    learning/             Platformaga xos: ProgressRing, LessonPath, ChoiceOption, FeedbackCard
    layout/               AppSidebar, BottomNav, menyu bandlari
    system/               Integratsiya holati (CONFIGURED / NOT CONFIGURED)
    theme/                Tema skripti va almashtirgich
    brand/                Platforma belgisi
  config/brand.ts         Platforma nomi va eslatmalar — bitta joyda
  lib/integrations.ts     Tashqi servislar holati (faqat nomlar, qiymatlar hech qachon)
e2e/                      Playwright testlari
tests/                    Vitest sozlamalari
```

## Texnik qarorlar

| Qaror | Sabab |
| --- | --- |
| Next.js 16.4, React 19.3 | Sahifalar va server kodi bir joyda; Cache Components yoqilgan |
| TypeScript 6.0.3 (7 emas) | ESLint'ning TypeScript qoidalari hozircha `<6.1` versiyani qo'llaydi |
| Tailwind CSS 4, standart ranglar o'chirilgan | Faqat platforma palitrasi ishlatiladi; komponentlar semantik tokenlardan rang oladi |
| Onest shrifti (npm orqali, o'zimizda) | O'zbek lotin harflari (oʻ, gʻ, ʼ) va kirill bor; Google serverlariga bog'liq emas |
| Komponentlar Radix asosida qo'lda yozilgan | shadcn/ui uslubida, kod to'liq loyihada; tashqi registrga bog'liqlik yo'q |
| Tema — inline skript + `localStorage` | Next.js tavsiyasi: sahifa chizilishidan oldin qo'yiladi, miltillamaydi |
| Binafsha rang faqat signal uchun | Asosiy harakat, progress va joriy joy; qolgani navy va neytral |
| Matnda `ʻ` (U+02BB) va `ʼ` (U+02BC) | O'zbek lotin alifbosining to'g'ri belgilari |

## Ranglar kontrasti (WCAG)

Barcha matn juftliklari kamida 4.5:1, input chegaralari kamida 3:1. Qiymatlar
`/design-system` sahifasida ko'rsatilgan va axe skani bilan avtomatik tekshiriladi.

## Xavfsizlik qoidalari

- Maxfiy kalitlar faqat serverda. `NEXT_PUBLIC_` o'zgaruvchilariga maxfiy qiymat yozilmaydi.
- `.env.local` gitga yuklanmaydi; namunasi — `.env.example` (test u bilan kod mosligini tekshiradi).
- `lib/integrations.ts` faqat o'zgaruvchi BOR-YO'QLIGINI tekshiradi, qiymatini qaytarmaydi.
