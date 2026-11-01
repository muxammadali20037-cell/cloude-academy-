import { DEFAULT_LESSON_STEPS } from "@/components/learning/lesson-path";
import { cn } from "@/lib/utils";

/**
 * Darsning 10 qismi uch bosqichda: o'rganasiz → bajarasiz → tushunasiz.
 * Bu haqiqiy ketma-ketlik, shuning uchun raqamlar ma'noli.
 */
const PHASES = [
  { title: "Oʻrganasiz", note: "Video, ovoz, matn va vizual koʻrsatma", from: 0, to: 3 },
  { title: "Bajarasiz", note: "Saytning oʻzida amaliy vazifa va mashq", from: 4, to: 5 },
  { title: "Tushunasiz", note: "Tekshiruv, xatolar tahlili va mustahkamlash", from: 6, to: 9 },
] as const;

export function LessonFlow({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-4 md:grid-cols-3", className)}>
      {PHASES.map((phase, phaseIndex) => (
        <li key={phase.title} className="flex flex-col gap-4 rounded-panel bg-surface p-5 sm:p-6">
          <div aria-hidden className="flex gap-1">
            {DEFAULT_LESSON_STEPS.map((step, index) => (
              <span
                key={step.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  index >= phase.from && index <= phase.to ? "bg-primary" : "bg-fg/10",
                )}
              />
            ))}
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-fg">{phase.title}</h3>
            <p className="mt-1 text-sm text-fg-muted">{phase.note}</p>
          </div>
          <ol start={phase.from + 1} className="space-y-2">
            {DEFAULT_LESSON_STEPS.slice(phase.from, phase.to + 1).map((step, offset) => (
              <li key={step.id} className="flex items-baseline gap-3 text-[0.9375rem] text-fg">
                <span className="w-5 shrink-0 text-right text-sm tabular-nums text-fg-subtle">
                  {phase.from + offset + 1}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
          <span className="sr-only">{phaseIndex + 1}-bosqich</span>
        </li>
      ))}
    </ol>
  );
}
