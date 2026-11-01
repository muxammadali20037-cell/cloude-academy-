import type { Metadata } from "next";
import {
  BookOpen,
  Clock,
  Flame,
  Headphones,
  MessagesSquare,
  Plus,
  Target,
  VideoOff,
} from "lucide-react";
import Link from "next/link";
import { BrandMark, Wordmark } from "@/components/brand/wordmark";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { EmptyState } from "@/components/learning/empty-state";
import { FeedbackCard } from "@/components/learning/feedback-card";
import { LessonPath } from "@/components/learning/lesson-path";
import { ProgressRing } from "@/components/learning/progress-ring";
import { StatTile } from "@/components/learning/stat-tile";
import { IntegrationBadge, IntegrationStatusRow } from "@/components/system/integration-status";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { brand } from "@/config/brand";
import { getIntegrationStatuses } from "@/lib/integrations";
import { LiveExercise } from "@/components/marketing/live-exercise";
import { NarratedPlayer } from "@/components/narration/narrated-player";
import { getNarrationByKey } from "@/lib/narration/registry";
import { FormDemo } from "./_components/form-demo";
import { DialogDemo, TabsDemo, TooltipDemo } from "./_components/overlay-demo";
import { Frame, Section, SubHeading } from "./_components/section";
import { NAVY_SCALE, SEMANTIC_TOKENS, TYPE_SCALE, VIOLET_SCALE } from "./_components/tokens";

export const metadata: Metadata = {
  title: "Dizayn tizimi",
  description: "Platformaning ranglar, shriftlar va komponentlar tizimi.",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "ranglar", label: "Ranglar" },
  { id: "tipografiya", label: "Tipografiya" },
  { id: "tugmalar", label: "Tugmalar" },
  { id: "forma", label: "Forma elementlari" },
  { id: "kartalar", label: "Kartalar va yorliqlar" },
  { id: "progress", label: "Progress" },
  { id: "mashq", label: "Mashq va feedback" },
  { id: "navigatsiya", label: "Navigatsiya" },
  { id: "holatlar", label: "Holatlar" },
  { id: "dars", label: "Dars ekrani" },
  { id: "ovozli-dars", label: "Ovozli dars" },
];

export default function DesignSystemPage() {
  const integrations = getIntegrationStatuses();
  const narration = getNarrationByKey("l1-m1-01");
  const configuredCount = integrations.filter((item) => item.configured).length;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="rounded-control" aria-label={`${brand.name} bosh sahifasi`}>
            <Wordmark />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:px-8">
        <nav aria-label="Boʻlimlar" className="sticky top-24 hidden self-start py-12 lg:block">
          <ul className="space-y-1 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-[0.5rem] px-3 py-1.5 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 space-y-20 py-10 sm:py-14">
          <div className="max-w-[65ch]">
            <h1 className="text-4xl font-semibold tracking-[-0.02em] text-fg sm:text-5xl">
              Dizayn tizimi
            </h1>
            <p className="mt-4 text-lg text-fg-muted">
              Platformaning barcha ekranlari shu ranglar, shriftlar va komponentlardan yigʻiladi.
              Binafsha rang faqat signal uchun: asosiy harakat, progress va talabaning joriy joyi.
            </p>
            <p className="mt-3 text-sm text-fg-subtle">
              Namunalardagi tugmalar faqat koʻrinishni koʻrsatadi. Ishlaydigan qismlar: tema, forma,
              tablar, dialog va namuna mashq.
            </p>
          </div>

          {/* RANGLAR */}
          <Section
            id="ranglar"
            title="Ranglar"
            description="Komponentlar rangni nomi boʻyicha emas, vazifasi boʻyicha oladi. Tema almashganda hamma narsa avtomatik moslashadi."
          >
            <SubHeading>Semantik tokenlar</SubHeading>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SEMANTIC_TOKENS.map((token) => (
                <li key={token.name} className="flex items-center gap-3.5 rounded-card border border-line p-3">
                  <span
                    aria-hidden
                    className="size-11 shrink-0 rounded-control ring-1 ring-line ring-inset"
                    style={{ background: `var(${token.cssVar})` }}
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-mono font-medium text-fg">{token.name}</p>
                    <p className="text-fg-muted">{token.role}</p>
                    <p className="font-mono text-xs text-fg-subtle">
                      {token.light} / {token.dark}
                      {token.contrast && <span> — kontrast {token.contrast}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {[
                { title: "Deep navy", scale: NAVY_SCALE },
                { title: "Electric violet", scale: VIOLET_SCALE },
              ].map(({ title, scale }) => (
                <div key={title}>
                  <SubHeading>{title}</SubHeading>
                  <ul className="flex overflow-hidden rounded-card ring-1 ring-line">
                    {scale.map(([step, hex]) => (
                      <li key={step} className="min-w-0 flex-1">
                        <span aria-hidden className="block h-14" style={{ background: hex }} />
                        <span className="block truncate bg-canvas px-1 py-1.5 text-center font-mono text-[0.6875rem] text-fg-subtle">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* TIPOGRAFIYA */}
          <Section
            id="tipografiya"
            title="Tipografiya"
            description="Onest — oʻzbek lotin (oʻ, gʻ, ʼ) va kirill harflarini toʻliq qoʻllaydigan shrift. Kod uchun JetBrains Mono. Shkala 1.25 nisbatda."
          >
            <ul className="divide-y divide-line border-y border-line">
              {TYPE_SCALE.map((item) => (
                <li key={item.token} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="w-28 shrink-0 font-mono text-xs text-fg-subtle">
                    {item.token} {item.px}px
                  </span>
                  <span className={`${item.className} min-w-0 break-words text-fg`}>{item.sample}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="min-w-0 rounded-card bg-surface p-5">
                <SubHeading>Matn namunasi</SubHeading>
                <p className="max-w-[65ch] text-fg">
                  Gʻoya oddiy: talaba darsni koʻradi, shu zahoti topshiriqni bajaradi va javobining
                  nega toʻgʻri yoki notoʻgʻri ekanini tushunadi. Maʼlumotlar faqat bazadan olinadi.
                </p>
                <p className="mt-3 text-fg-muted">Кирилл: Ўзбекча матн — ғоя, қадам, ҳаракат.</p>
              </div>
              <div className="min-w-0 rounded-card bg-surface p-5">
                <SubHeading>Kod</SubHeading>
                <pre
                  tabIndex={0}
                  aria-label="Kod namunasi"
                  className="overflow-x-auto rounded-control bg-canvas p-4 text-sm leading-relaxed text-fg ring-1 ring-line"
                >
                  <code>{`<document>
  <source>shartnoma.pdf</source>
  <document_content>…</document_content>
</document>
Xavfli bandlarni toping.`}</code>
                </pre>
              </div>
            </div>
          </Section>

          {/* TUGMALAR */}
          <Section
            id="tugmalar"
            title="Tugmalar"
            description="Har bir ekranda bitta asosiy tugma. Matn aniq harakatni aytadi: “Tekshirish”, “Davom ettirish”, “Testni yakunlash”."
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Davom ettirish</Button>
                <Button variant="secondary">Keyinroq</Button>
                <Button variant="outline">Dasturni koʻrish</Button>
                <Button variant="ghost">Bekor qilish</Button>
                <Button variant="danger">Kirishni bekor qilish</Button>
                <Button variant="link" asChild>
                  <a href="#mashq">Mashqqa oʻtish</a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Kichik</Button>
                <Button size="md">Oʻrta</Button>
                <Button size="lg">Katta</Button>
                <Button size="icon" variant="outline" aria-label="Yangi loyiha">
                  <Plus aria-hidden />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button loading>Tekshirilmoqda</Button>
                <Button disabled>Tekshirish</Button>
                <Button variant="outline">
                  <Headphones aria-hidden />
                  Ovozli tushuntirish
                </Button>
              </div>
            </div>
          </Section>

          {/* FORMA */}
          <Section
            id="forma"
            title="Forma elementlari"
            description="Label, izoh va xato matni boshqaruv elementiga bogʻlangan. Xato matni nima notoʻgʻri ekanini va qanday tuzatishni aytadi."
          >
            <FormDemo />
          </Section>

          {/* KARTALAR */}
          <Section
            id="kartalar"
            title="Kartalar va yorliqlar"
            description="Ierarxiya soya bilan emas, fon va chegara bilan beriladi. Soya faqat ustki qatlamlarda: dialog va tooltip."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Card variant="accent">
                <CardHeader>
                  <p className="mb-1 text-sm font-medium text-accent-fg">Keyingi dars</p>
                  <CardTitle>Claude Projects yaratish</CardTitle>
                  <CardDescription>1-daraja, 3-modul. Video, ovozli tushuntirish va amaliy vazifa.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LessonPath currentIndex={0} compact />
                </CardContent>
                <CardFooter className="border-primary/20">
                  <Button>Davom ettirish</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prompt va kontekst muhandisligi</CardTitle>
                  <CardDescription>2-daraja. Avval 1-darajani tugating.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>14 ta dars</Badge>
                    <Badge variant="outline">Qulflangan</Badge>
                  </div>
                  <Progress value={0} label="2-daraja progressi" />
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Badge>Neytral</Badge>
              <Badge variant="accent">Joriy</Badge>
              <Badge variant="success">Tugatildi</Badge>
              <Badge variant="warning">Tekshiruvda</Badge>
              <Badge variant="danger">Muddati oʻtgan</Badge>
              <Badge variant="outline">Qoralama</Badge>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div>
                <SubHeading>Tablar</SubHeading>
                <TabsDemo />
              </div>
              <div className="space-y-6">
                <div>
                  <SubHeading>Dialog</SubHeading>
                  <DialogDemo />
                </div>
                <div>
                  <SubHeading>Tooltip</SubHeading>
                  <TooltipDemo />
                </div>
              </div>
            </div>
          </Section>

          {/* PROGRESS */}
          <Section
            id="progress"
            title="Progress"
            description="Raqamlar faqat bazadan keladi. Yangi talaba hamma joyda 0 ni koʻradi — bu toʻgʻri holat, soxta raqam emas."
          >
            <SubHeading>Yangi talaba dashboardi</SubHeading>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Oʻtilgan darslar" value={0} unit="/ 28" icon={BookOpen} />
              <StatTile label="Ketma-ket kunlar" value={0} icon={Flame} />
              <StatTile label="Oʻqish vaqti" value={0} unit="daq" icon={Clock} />
              <StatTile label="Test natijasi" value="—" hint="Hali test topshirilmagan" icon={Target} />
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
              <div className="flex flex-wrap items-center gap-6">
                <ProgressRing value={0} label="Umumiy progress" />
                <ProgressRing value={42} label="Modul progressi" size={88} strokeWidth={8} />
                <ProgressRing value={100} label="Tugatilgan daraja" size={64} strokeWidth={6} />
              </div>
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-fg-muted">1-daraja</span>
                    <span className="font-medium tabular-nums">42%</span>
                  </div>
                  <Progress value={42} label="1-daraja progressi" />
                </div>
                <div>
                  <SubHeading>Dars yoʻli — joriy bosqich signal beradi</SubHeading>
                  <LessonPath currentIndex={4} />
                </div>
              </div>
            </div>
          </Section>

          {/* MASHQ */}
          <Section
            id="mashq"
            title="Mashq va feedback"
            description="Namuna mashq ishlaydi: javob tanlang va tekshiring. Xato javobda izoh doim bir xil tartibda chiqadi."
          >
            <div className="grid gap-10 xl:grid-cols-2">
              <Frame className="bg-canvas p-5 sm:p-6">
                <LiveExercise />
              </Frame>
              <div className="space-y-5">
                <SubHeading>Toʻgʻri javobdagi koʻrinish</SubHeading>
                <FeedbackCard
                  result="correct"
                  animateIn={false}
                  explanation={{
                    reason:
                      "System prompt Claudeʼning rolini va qoidalarini butun suhbat davomida belgilaydi.",
                  }}
                />
              </div>
            </div>
          </Section>

          {/* NAVIGATSIYA */}
          <Section
            id="navigatsiya"
            title="Navigatsiya"
            description="Desktopda chap sidebar, mobil telefonda pastki menyu. Faol boʻlim binafsha signal chizigʻi bilan belgilanadi."
          >
            <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
              <Frame className="h-[34rem] w-fit">
                <AppSidebar
                  as="div"
                  navLabel="Sidebar namunasi"
                  currentPath="/app/kurs"
                  courseProgress={0}
                  interactive={false}
                />
              </Frame>
              <div>
                <SubHeading>Mobil pastki menyu</SubHeading>
                <Frame className="max-w-sm">
                  <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-fg-subtle">
                    Ekran mazmuni
                  </div>
                  <BottomNav
                    currentPath="/app"
                    position="static"
                    interactive={false}
                    navLabel="Pastki menyu namunasi"
                  />
                </Frame>
              </div>
            </div>
          </Section>

          {/* HOLATLAR */}
          <Section
            id="holatlar"
            title="Holatlar"
            description="Boʻsh ekran keyingi harakatga yoʻl koʻrsatadi. Yuklanayotgan joyda skelet turadi. Ulanmagan servis ochiq aytiladi."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <EmptyState
                icon={MessagesSquare}
                title="Mentorga hali savol bermadingiz"
                description="Darsdagi tushunmagan joyingizni yozing — mentor boshqa misol bilan tushuntiradi."
                action={<Button variant="outline" disabled>Savol yozish</Button>}
              />
              <div role="status" className="space-y-3 rounded-card border border-line p-5">
                <span className="sr-only">Yuklanmoqda</span>
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="mt-4 h-10 w-36" />
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <SubHeading>Tashqi servislar — joriy holat</SubHeading>
                <p className="text-sm text-fg-subtle">
                  {configuredCount} / {integrations.length} ulangan
                </p>
              </div>
              <div className="divide-y divide-line rounded-card border border-line px-5">
                {integrations.map((item) => (
                  <IntegrationStatusRow
                    key={item.id}
                    name={item.name}
                    purpose={item.purpose}
                    configured={item.configured}
                    phase={item.phase}
                    provider={item.provider}
                    missing={item.missing}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* DARS EKRANI */}
          <Section
            id="dars"
            title="Dars ekrani"
            description="Komponentlar birga: chapda oʻrganish, oʻngda bajarish. Mobil telefonda bitta ustun. Video va ovoz ulanmaguncha ochiq aytiladi."
          >
            <Frame className="bg-canvas">
              <div className="border-b border-line px-5 py-4 sm:px-6">
                <p className="text-sm text-fg-subtle">1-daraja, 3-modul</p>
                <p className="text-lg font-semibold tracking-tight">Claude Projects yaratish</p>
                <LessonPath currentIndex={4} className="mt-4" />
              </div>
              <div className="grid lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
                <div className="space-y-5 p-5 sm:p-6 lg:border-r lg:border-line">
                  <EmptyState
                    icon={VideoOff}
                    title="Video hali yuklanmagan"
                    description="Video provayder 3-fazada ulanadi. Unga qadar bu yerda soxta video koʻrsatilmaydi."
                  />
                  <div className="flex items-center justify-between gap-4 rounded-control bg-surface px-4 py-3">
                    <p className="flex items-center gap-2 text-sm text-fg-muted">
                      <Headphones aria-hidden className="size-4" />
                      Ovozli tushuntirish
                    </p>
                    <IntegrationBadge configured={false} />
                  </div>
                  <div className="max-w-[65ch] space-y-3 text-fg">
                    <p>
                      Project — bu bitta mavzu boʻyicha suhbatlar, fayllar va koʻrsatmalar
                      toʻplangan joy. Unga yuklangan hujjatlar va yozilgan koʻrsatmalar shu
                      projectdagi har bir yangi suhbatda hisobga olinadi.
                    </p>
                  </div>
                </div>
                <div className="space-y-4 border-t border-line p-5 sm:p-6 lg:border-t-0">
                  <div>
                    <Badge variant="accent">Amaliy vazifa</Badge>
                    <p className="mt-3 font-medium text-fg">
                      Oʻz biznesingiz uchun project koʻrsatmasini yozing
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">
                      Rol, auditoriya va javob uslubini koʻrsating. 3–6 gap yetarli.
                    </p>
                  </div>
                  <Textarea
                    aria-label="Vazifa javobi"
                    rows={6}
                    placeholder="Siz bizning onlayn doʻkonimiz yordamchisisiz…"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button disabled>Tekshirish</Button>
                    <p className="text-sm text-fg-subtle">AI tekshiruv 5-fazada ulanadi</p>
                  </div>
                </div>
              </div>
            </Frame>
          </Section>

          {/* OVOZLI DARS */}
          <Section
            id="ovozli-dars"
            title="Ovozli dars"
            description="Animatsiya harakatni koʻrsatadi, oʻqituvchi ovozi uni tushuntiradi, subtitr bir vaqtda chiqadi. Gap faqat harakat ekranda koʻringandan keyin boshlanadi. Namuna — 1-dars, matni admin tekshiruvida."
          >
            {narration ? (
              <NarratedPlayer timeline={narration} className="max-w-4xl" />
            ) : (
              <EmptyState icon={VideoOff} title="Ovozli dars topilmadi" description="Generatorni ishga tushiring: npm run narration -- --all" />
            )}
          </Section>
        </main>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2">
            <BrandMark size={20} />
            {brand.name}
          </span>
          <p>{brand.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
