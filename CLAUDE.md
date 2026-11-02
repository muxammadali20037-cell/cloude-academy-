# Claude Academy — loyiha qoidalari

@AGENTS.md

O'zbek tilidagi pullik AI ta'lim platformasi. Rejasi: Phase 1 hujjati
(https://claude.ai/artifact/4kxDzfK5DYR5vTHLxGR3tL). Foydalanuvchi dasturchi emas —
har bir qarorni oddiy o'zbek tilida izohlang.

## Qat'iy qoidalar

- Soxta ma'lumot yo'q: statistika, sharh, to'lov, video, ovoz — faqat haqiqiy manbadan.
  Ulanmagan servis `NOT CONFIGURED` deb ko'rsatiladi (`src/lib/integrations.ts`).
- Maxfiy kalitlar faqat serverda. `NEXT_PUBLIC_` ga maxfiy qiymat yozilmaydi.
  Yangi o'zgaruvchi qo'shilsa — `.env.example` ga ham (test buni tekshiradi).
- To'lov holatiga faqat provayder webhook'i tekshirilgandan keyin ishoniladi.
- Talaba kodi hech qachon asosiy serverda ishga tushirilmaydi.
- Har bir jadvalda RLS. Migratsiyalar `supabase/migrations/` da, RLS testlari bilan.
- Brend nomi faqat `src/config/brand.ts` da. Anthropic/Claude logotipi ishlatilmaydi.
- Tekshirilmagan funksiya "tayyor" deb e'lon qilinmaydi.

## Dizayn

- Ranglar faqat semantik tokenlar orqali (`bg-canvas`, `text-fg`, `bg-primary`...).
  Tailwind standart ranglari o'chirilgan. Binafsha — faqat signal: asosiy harakat,
  progress, joriy joy.
- O'zbek matnida `ʻ` (U+02BB: oʻ, gʻ) va `ʼ` (U+02BC: tutuq belgisi).
- Yangi komponent avval `/design-system` sahifasiga qo'shiladi.
- WCAG 2.2 AA: e2e testdagi axe skani 0 buzilish bilan o'tishi shart.

## Baza

- Migratsiyalar `supabase/migrations/` da; har biri `npm run test` (tests/db, PGlite) bilan
  tekshiriladi. Yangi jadval → RLS + `revoke` ortiqcha huquqlar + test.
- Bulutga qo'llash: Supabase MCP `apply_migration`, keyin `get_advisors` (security va performance).
- Progress, kirish huquqi va baholash faqat SECURITY DEFINER funksiyalar orqali yoziladi —
  ular `private` sxemadagi yordamchilar bilan foydalanuvchi va huquqni tekshiradi.
- Darslar `planned → draft → review → published`. AI yozgan matn `review` holatida qoladi,
  admin tasdiqlamaguncha nashr qilinmaydi.

## Ovozli darslar

- Ssenariy `content/narration/<dars>/script.json`; ovoz GitHub Actions'da (`narration.yml`) yaratiladi.
- Gap faqat harakat ekranda ko'ringandan keyin boshlanadi (`timelineProblems` tekshiradi);
  ekranda ko'rsatilmagan harakat haqida gapirilmaydi.
- Provayder tartibi: VoiceLab (`VOICELAB_API_KEY`) → Azure → MMS. MMS — faqat sinov ovozi (CC-BY-NC).
  Tasdiqlangan (`approved`) darsda faqat tijoriy ruxsati tasdiqlangan ovoz.
- Aytiladigan matnda raqam yo'q — so'z bilan yoziladi; inglizcha nomlar `lexicon` orqali o'qiladi.

## Tekshiruv (har bir o'zgarishdan keyin)

```bash
npm run check                      # lint + typecheck + test + build
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome npm run test:e2e
```

CI (`.github/workflows/ci.yml`) xuddi shularni har bir push'da bajaradi.

## Infratuzilma

| Narsa | Qiymat |
| --- | --- |
| GitHub | `muxammadali20037-cell/cloude-academy-` |
| Supabase loyiha | `claude-academy`, ref `muioaoawbtutxhfgnkvs`, eu-central-1 (Frankfurt) |
| Boshqa Supabase loyiha | `izmonnkzyolaqwjwjvzj` — Avtodrom mahsuloti. **Unga tegilmaydi.** |
| TypeScript | 6.0.3 — typescript-eslint `<6.1` ni qo'llaydi; 7 ga o'tmang |

Bulutli ish muhitida supabase.co ga to'g'ridan-to'g'ri tarmoq ulanishi bloklangan:
bazani Supabase MCP vositalari orqali boshqaring.
