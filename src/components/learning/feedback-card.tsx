"use client";

import { CircleCheck, CircleX, Lightbulb, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeedbackExplanation = {
  /** Nima xato bo'ldi (talaba nimani tanladi/yozdi). */
  whatWrong?: string;
  /** Nega bu xato. */
  why?: string;
  /** To'g'ri javob. */
  correctAnswer?: string;
  /** Nega aynan shu javob to'g'ri. */
  reason?: string;
  /** Qanday eslab qolish mumkin. */
  remember?: string;
};

export type FeedbackCardProps = {
  result: "correct" | "incorrect";
  explanation: FeedbackExplanation;
  /** "O'xshash mashq" tugmasi bosilganda (faqat xato javobda). */
  onSimilar?: () => void;
  /** Asosiy harakat, masalan "Keyingi qadam" tugmasi. */
  action?: React.ReactNode;
  /**
   * Paydo bo'lish animatsiyasi. Javobdan keyin chiqqanda true (standart);
   * sahifa bilan birga turgan statik kartada false.
   */
  animateIn?: boolean;
  className?: string;
};

const INCORRECT_SECTIONS: { key: keyof FeedbackExplanation; title: string }[] = [
  { key: "whatWrong", title: "Nima xato boʻldi" },
  { key: "why", title: "Nega bu xato" },
  { key: "correctAnswer", title: "Toʻgʻri javob" },
  { key: "reason", title: "Nega aynan shu" },
];

/**
 * Javobdan keyingi izoh. Xato javobda bo'limlar doim bir xil tartibda:
 * nima xato → nega → to'g'ri javob → sababi → eslab qolish → o'xshash mashq.
 */
export function FeedbackCard({
  result,
  explanation,
  onSimilar,
  action,
  animateIn = true,
  className,
}: FeedbackCardProps) {
  const correct = result === "correct";

  return (
    <motion.section
      role="status"
      aria-live="polite"
      initial={animateIn ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "overflow-hidden rounded-card border",
        correct ? "border-success/40" : "border-danger/40",
        className,
      )}
    >
      <header
        className={cn(
          "flex items-center gap-2.5 px-5 py-3.5 font-semibold",
          correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        )}
      >
        {correct ? (
          <CircleCheck aria-hidden className="size-5" />
        ) : (
          <CircleX aria-hidden className="size-5" />
        )}
        <h3>{correct ? "Toʻgʻri javob" : "Notoʻgʻri javob"}</h3>
      </header>

      <div className="space-y-4 bg-canvas px-5 py-4">
        {correct ? (
          explanation.reason && <p className="text-[0.9375rem] text-fg">{explanation.reason}</p>
        ) : (
          <dl className="space-y-3.5">
            {INCORRECT_SECTIONS.map(({ key, title }) =>
              explanation[key] ? (
                <div key={key}>
                  <dt className="text-sm font-medium text-fg-subtle">{title}</dt>
                  <dd
                    className={cn(
                      "mt-0.5 text-[0.9375rem] text-fg",
                      key === "correctAnswer" && "font-semibold",
                    )}
                  >
                    {explanation[key]}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        )}

        {explanation.remember && (
          <div className="flex gap-3 rounded-control bg-surface p-3.5">
            <Lightbulb aria-hidden className="mt-0.5 size-4.5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-fg">Qanday eslab qolish</p>
              <p className="mt-0.5 text-sm text-fg-muted">{explanation.remember}</p>
            </div>
          </div>
        )}

        {(action || (!correct && onSimilar)) && (
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {!correct && onSimilar && (
              <Button variant="outline" size="sm" onClick={onSimilar}>
                <RotateCcw aria-hidden />
                Oʻxshash mashq
              </Button>
            )}
            {action}
          </div>
        )}
      </div>
    </motion.section>
  );
}
