import { clamp, cn } from "@/lib/utils";

export type LessonStep = { id: string; label: string };

/** Topshiriqdagi darsning 10 qismi — dars yo'lining standart bosqichlari. */
export const DEFAULT_LESSON_STEPS: LessonStep[] = [
  { id: "video", label: "Video kirish" },
  { id: "voice", label: "Ovozli tushuntirish" },
  { id: "text", label: "Matnli izoh" },
  { id: "visual", label: "Vizual koʻrsatma" },
  { id: "task", label: "Amaliy vazifa" },
  { id: "exercise", label: "Interaktiv mashq" },
  { id: "review", label: "AI tekshiruv" },
  { id: "mistakes", label: "Xatolar tahlili" },
  { id: "quiz", label: "Mustahkamlash testi" },
  { id: "next", label: "Keyingi bosqich" },
];

export type LessonPathProps = {
  steps?: LessonStep[];
  /** Joriy bosqich indeksi (0 dan). Undan oldingilar tugatilgan hisoblanadi. */
  currentIndex: number;
  /** Ixcham ko'rinish: faqat chiziq, sarlavhasiz. */
  compact?: boolean;
  className?: string;
};

/**
 * Dars yo'li — platformaning o'ziga xos elementi. Talaba darsning qaysi
 * bosqichida turganini bir qarashda ko'radi. Faqat joriy bosqich "signal"
 * beradi; boshqa hech qayerda doimiy animatsiya yo'q.
 */
export function LessonPath({
  steps = DEFAULT_LESSON_STEPS,
  currentIndex,
  compact = false,
  className,
}: LessonPathProps) {
  const total = steps.length;
  const current = clamp(Math.trunc(currentIndex), 0, Math.max(0, total - 1));
  const currentStep = steps[current];

  return (
    <nav aria-label="Dars bosqichlari" className={cn("w-full", className)}>
      {!compact && currentStep && (
        <div className="mb-2.5 flex items-baseline justify-between gap-4 text-sm">
          <p className="font-medium text-fg">{currentStep.label}</p>
          <p className="shrink-0 tabular-nums text-fg-subtle">
            {current + 1}-qadam, jami {total}
          </p>
        </div>
      )}
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => {
          const status = index < current ? "done" : index === current ? "current" : "upcoming";
          const statusText =
            status === "done" ? "tugatildi" : status === "current" ? "joriy bosqich" : "oldinda";
          return (
            <li
              key={step.id}
              aria-current={status === "current" ? "step" : undefined}
              data-status={status}
              title={step.label}
              className="flex-1"
            >
              <span className="sr-only">
                {index + 1}. {step.label}, {statusText}
              </span>
              <span
                aria-hidden
                className={cn(
                  "block h-1.5 rounded-full transition-colors duration-300",
                  status === "done" && "bg-primary",
                  status === "current" && "animate-signal bg-primary",
                  status === "upcoming" && "bg-fg/12",
                )}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
