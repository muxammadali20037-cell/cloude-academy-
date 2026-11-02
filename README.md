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
| 6 · Ovozli darslar | Tizim tayyor va sinovdan o'tgan; 1-dars namunasi (sinov ovozi). Azure kaliti kutilmoqda |
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
| `npm run narration -- --all` | Ovozli darslarni yaratish (TTS provayder bo'lmasa — subtitrli ovozsiz vaqt shkalasi) |

GitHub Actions har bir push'da ikki ishni bajaradi (`.github/workflows/ci.yml`):

1. **check** — lint, typecheck, barcha testlar, build, e2e.
2. **e2e-supabase** — Docker'da to'liq mahalliy Supabase (`supabase start`), migratsiyalar,
   test darslari (`e2e-supabase/fixtures.sql`) va haqiqiy talaba yo'li: ro'yxatdan o'tish →
   pochtadan kod → dashboard → dars → tugatish → progress → chiqish. Skrinshotlar artefakt
   sifatida saqlanadi.

## Ovozli darslar (o'qituvchi ovozi)

Har bir dars videosi — animatsiya + o'zbekcha ovoz + subtitr. Video fayl emas: animatsiya
kodda, ovoz alohida MP3 faylda, ularni vaqt shkalasi bog'laydi.

1. **Ssenariy** — `content/narration/<dars>/script.json`: sahnalar, har bir qadamdagi harakat
   (bosish, yozish, ajratib ko'rsatish) va o'qituvchi matni. Har bir gap "nima / nega / qayerga /
   natija / xato chiqsa" turlaridan biri; darsda beshalasi bo'lishi shart.
2. **Ovoz** — ssenariy o'zgarib push qilinganda GitHub Actions (`narration.yml`) har bir gapni
   TTS bilan ovozga aylantiradi, haqiqiy uzunligini o'lchaydi va vaqt shkalasini quradi:
   gap har doim harakat ekranda ko'ringandan **keyin** boshlanadi. Natija repoga saqlanadi:
   `public/narration/<dars>/narration.mp3`, `subtitles.vtt`, `content/narration/<dars>/timeline.json`.
3. **Tekshiruv** — sifat hisoboti (`report.json`): har bir gap uzunligi, tezligi, balandligi,
   uzun pauzalar va nutqni tanish modeli bilan matn solishtiruvi (CER).
4. **Pleyer** — `NarratedPlayer`: ijro/pauza, joriy tushuntirishni qayta, boshidan, tezlik,
   ovozni yoqish/o'chirish, balandlik, subtitr, to'liq ekran, matndan tanlash, klaviatura.
   Audio oldindan to'liq yuklanadi; yuklanmasa dars subtitr bilan davom etadi.

**Provayder** (GitHub secrets'dagi kalitga qarab, shu tartibda):

1. **VoiceLab** (voicelab.uz) — `VOICELAB_API_KEY`. Ovoz ssenariyda nomi bilan tanlanadi
   (`voice.voicelab.voice`). Tijoriy ruxsat tarifga bog'liq: tarif shartlarini tekshirib,
   `commercialLicense: true` qilinadi; unga qadar pleyer "tijoriy ruxsat tasdiqlanmagan" deb ko'rsatadi.
2. **Azure** — `AZURE_SPEECH_KEY` va `AZURE_SPEECH_REGION` (o'zbekcha neyron ovoz, tijoriy).
3. **Meta MMS** — kalit kerak emas, lekin **faqat sinov**: litsenziyasi tijoriy foydalanishni taqiqlaydi.

Test tijoriy ruxsati tasdiqlanmagan ovozni tasdiqlangan (`approved`) darsga qo'ydirmaydi.
Kalit qo'shilgach: Actions → "Ovozli darslar (TTS)" → Run workflow.

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
    narration/            Ovozli dars pleyeri, sahna, audio soati
    marketing/            Landing bo'limlari, jonli mashq, tariflar, FAQ
    layout/, system/, theme/, brand/
  config/                 Brend, imkoniyatlar holati
  lib/
    supabase/             Klientlar, turlar, proxy sessiyasi
    data/                 Ma'lumotlar qatlami (har doim halol holat qaytaradi)
    narration/            Ssenariy/vaqt shkalasi modeli, sahna holati, subtitr, transliteratsiya
    auth.ts               Joriy foydalanuvchi (token imzosi tekshiriladi)
content/narration/        Ovozli dars ssenariylari va yaratilgan vaqt shkalalari
tools/narration/          Ovoz generatori (Azure / MMS), ASR tekshiruvi, MP4 eksport
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
