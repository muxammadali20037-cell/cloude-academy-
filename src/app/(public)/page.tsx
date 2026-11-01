import { CircleCheck, Hammer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CurriculumView, type LessonState } from "@/components/learning/curriculum-view";
import { Faq } from "@/components/marketing/faq";
import { LessonFlow } from "@/components/marketing/lesson-flow";
import { LiveExercise } from "@/components/marketing/live-exercise";
import { Pricing } from "@/components/marketing/pricing";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { FEATURES } from "@/config/features";
import { getActivePlans, getPublicCurriculum } from "@/lib/data/curriculum";
import type { CurriculumLesson } from "@/lib/data/curriculum-shape";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — Claude AIʼni oʻzbek tilida amaliyot bilan oʻrganing` },
  description:
    "Interaktiv darslar, amaliy mashqlar va AI mentor bilan Claudeʼni noldan professional darajagacha oʻrganing.",
};

const OUTCOMES = [
  "Claudeʼdan kundalik ishda foydalanasiz: Projects, fayllar, Research va Connectors.",
  "Aniq va tekshiriladigan natija beradigan promptlar yozasiz, gallyutsinatsiyani ajratasiz.",
  "Claude Code bilan ilova yaratib, testlab, internetga chiqarasiz.",
  "Skills, MCP va agentlar bilan ish jarayonlarini avtomatlashtirasiz.",
  "Claude API bilan production darajasidagi ilovalar qurasiz.",
  "Portfolio uchun 8 ta toʻliq loyiha tayyorlaysiz.",
];

const publicStateOf = (lesson: CurriculumLesson): LessonState => {
  if (lesson.status !== "published") return "soon";
  return lesson.isFreePreview ? "free" : "locked";
};

export default async function HomePage() {
  const [curriculum, plans] = await Promise.all([getPublicCurriculum(), getActivePlans()]);
  const course = curriculum.status === "ok" ? curriculum.data : null;

  return (
    <main>
      {/* Hero: va'da va uning isboti — shu ekrandagi haqiqiy mashq */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <h1 className="text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-fg sm:text-6xl">
            Claude AIʼni professional darajada oʻrganing.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-fg-muted sm:text-xl">
            Shunchaki video tomosha qilmang. Interaktiv darslarda bajaring, AI ustozdan tushuncha oling va
            haqiqiy loyihalar yarating.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/kirish?next=/app">Kursni boshlash</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/bepul-dars">Bepul darsni sinab koʻrish</Link>
            </Button>
          </div>
          {course && (
            <p className="mt-6 text-sm tabular-nums text-fg-subtle">
              {course.levels.length} ta daraja, {course.lessonCount} ta dars, oʻzbek tilida
            </p>
          )}
        </div>

        <div className="rounded-panel border border-line bg-canvas p-5 sm:p-7">
          <p className="mb-5 text-sm font-medium text-accent-fg">Hoziroq sinab koʻring — bu haqiqiy mashq</p>
          <LiveExercise />
        </div>
      </section>

      {/* Dars qanday ishlaydi */}
      <section aria-labelledby="flow-title" className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 id="flow-title" className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Dars tomosha qilinmaydi — bajariladi
            </h2>
            <p className="mt-3 text-lg text-fg-muted">
              Har bir dars bir xil yoʻldan oʻtadi. Amaliy vazifa darsning oʻrtasida turadi, oxirida emas.
            </p>
          </div>
          <LessonFlow className="mt-10" />
        </div>
      </section>

      {/* Kurs dasturi */}
      <section aria-labelledby="program-title" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 id="program-title" className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                Oddiy suhbatdan agentlargacha
              </h2>
              <p className="mt-3 text-lg text-fg-muted">
                Olti daraja. Har biri oʻz mashqlari, imtihoni va loyihasi bilan. Darslar tekshirilgan sari
                nashr qilinadi.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dastur">Toʻliq dastur</Link>
            </Button>
          </div>
          <div className="mt-10">
            {course ? (
              <CurriculumView
                curriculum={course}
                stateOf={publicStateOf}
                hrefOf={(lesson, state) => (state === "free" ? `/bepul-dars/${lesson.id}` : null)}
              />
            ) : (
              <p className="rounded-panel bg-surface p-6 text-fg-muted">
                Kurs dasturi hozircha yuklanmadi. Birozdan keyin sahifani yangilang.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Imkoniyatlar — har birining haqiqiy holati bilan */}
      <section aria-labelledby="features-title" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 id="features-title" className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Platforma bosqichma-bosqich ishga tushmoqda
            </h2>
            <p className="mt-3 text-lg text-fg-muted">Nima ishlayotgani va nima tayyorlanayotgani ochiq koʻrsatilgan.</p>
          </div>
          <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                {feature.status === "ready" ? (
                  <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
                ) : (
                  <Hammer aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-subtle" />
                )}
                <div>
                  <p className="font-semibold text-fg">
                    {feature.title}
                    <span
                      className={cn(
                        "ml-2 text-sm font-medium",
                        feature.status === "ready" ? "text-success" : "text-fg-subtle",
                      )}
                    >
                      {feature.status === "ready" ? "Ishlaydi" : "Ishlab chiqilmoqda"}
                    </span>
                  </p>
                  <p className="mt-1 text-fg-muted">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Kurs natijalari */}
      <section aria-labelledby="outcomes-title" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 id="outcomes-title" className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Kurs oxirida nimalarni qila olasiz
            </h2>
            <p className="mt-3 text-lg text-fg-muted">
              Barcha talablarni bajarganlar QR kod bilan tekshiriladigan sertifikat oladi.
            </p>
          </div>
          <ol className="space-y-4">
            {OUTCOMES.map((outcome, index) => (
              <li key={outcome} className="flex gap-4 border-b border-line pb-4 last:border-0">
                <span className="w-6 shrink-0 pt-0.5 text-sm font-medium tabular-nums text-accent-fg">{index + 1}</span>
                <span className="text-lg text-fg">{outcome}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tariflar */}
      <section id="tariflar" aria-labelledby="pricing-title" className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="pricing-title" className="mb-10 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Tariflar
          </h2>
          <Pricing plans={plans} />
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <h2 id="faq-title" className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Koʻp soʻraladigan savollar
          </h2>
          <Faq />
        </div>
      </section>

      {/* Yakuniy CTA */}
      <section className="border-t border-line bg-navy-950">
        <div className="dark mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Claudeʼni oʻrganma. Uni boshqarishni oʻrgan.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/kirish?next=/app">Kursni boshlash</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link href="/bepul-dars">Bepul darsni sinab koʻrish</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
