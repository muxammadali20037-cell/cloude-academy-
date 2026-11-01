"use client";

import { ArrowLeft, CircleCheck, Headphones, VideoOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { LessonPath } from "@/components/learning/lesson-path";
import { Markdown } from "@/components/learning/markdown";
import { IntegrationBadge } from "@/components/system/integration-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LessonDetail, LessonStep, ProgressState } from "@/lib/data/learning";

export type LessonPlayerActions = {
  start: (lessonId: string) => Promise<{ ok: true; progress: ProgressState } | { ok: false; message: string }>;
  goToStep: (lessonId: string, step: number) => Promise<{ ok: true; progress: ProgressState } | { ok: false; message: string }>;
  complete: (lessonId: string, minVideoPercent: number) => Promise<{ ok: true; progress: ProgressState } | { ok: false; message: string }>;
  recordTime: (lessonId: string, seconds: number) => Promise<void>;
};

export type LessonPlayerProps = {
  lesson: Pick<LessonDetail, "id" | "title" | "steps" | "media" | "completionRule">;
  /** student — progress saqlanadi; visitor — akkauntsiz ko'rish (bepul dars). */
  mode: "student" | "visitor";
  initialProgress: ProgressState | null;
  videoConfigured: boolean;
  actions?: LessonPlayerActions;
};

const EXERCISE_KINDS = new Set(["task", "exercise", "quiz", "review", "mistakes"]);
const HEARTBEAT_SECONDS = 60;

export function LessonPlayer({ lesson, mode, initialProgress, videoConfigured, actions }: LessonPlayerProps) {
  const totalSteps = lesson.steps.length;
  const lastIndex = Math.max(0, totalSteps - 1);
  const [progress, setProgress] = useState<ProgressState | null>(initialProgress);
  const [viewStep, setViewStep] = useState(() => Math.min(initialProgress?.currentStep ?? 0, lastIndex));
  const [visitorMax, setVisitorMax] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const isStudent = mode === "student" && actions !== undefined;
  const completed = progress?.status === "completed";
  const maxReached = isStudent ? (progress?.maxStepReached ?? 0) : visitorMax;

  // Darsni boshlash (progress yozuvi yaratiladi yoki yangilanadi).
  useEffect(() => {
    if (!isStudent) return;
    let cancelled = false;
    actions.start(lesson.id).then((result) => {
      if (cancelled) return;
      if (result.ok) setProgress(result.progress);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
    // Faqat bir marta, dars ochilganda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, isStudent]);

  // O'qish vaqti: sahifa ko'rinib turganda har daqiqada.
  useEffect(() => {
    if (!isStudent) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void actions.recordTime(lesson.id, HEARTBEAT_SECONDS);
    }, HEARTBEAT_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [actions, isStudent, lesson.id]);

  const showStep = useCallback((index: number) => {
    setViewStep(index);
    requestAnimationFrame(() => headingRef.current?.focus());
  }, []);

  function goTo(index: number) {
    setError(null);
    if (!isStudent) {
      setVisitorMax((max) => Math.max(max, index));
      showStep(index);
      return;
    }
    startTransition(async () => {
      const result = await actions.goToStep(lesson.id, index);
      if (result.ok) {
        setProgress(result.progress);
        showStep(index);
      } else {
        setError(result.message);
      }
    });
  }

  function finish() {
    if (!isStudent) return;
    setError(null);
    startTransition(async () => {
      const result = await actions.complete(lesson.id, lesson.completionRule.minVideoPercent);
      if (result.ok) setProgress(result.progress);
      else setError(result.message);
    });
  }

  if (totalSteps === 0) {
    return (
      <p className="rounded-card bg-surface p-5 text-fg-muted">Bu dars mazmuni hali qoʻshilmagan.</p>
    );
  }

  const step = lesson.steps[viewStep];
  const isLast = viewStep === lastIndex;

  return (
    <div className="space-y-6">
      <LessonPath steps={lesson.steps.map((s) => ({ id: s.id, label: s.title }))} currentIndex={viewStep} />

      <section aria-labelledby="step-title" className="min-h-64">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-fg outline-none">
            {step.title}
          </h2>
          {EXERCISE_KINDS.has(step.kind) && <Badge variant="accent">Amaliyot</Badge>}
        </div>
        <StepBody step={step} hasVideo={lesson.media.some((m) => m.kind === "video")} videoConfigured={videoConfigured} />
      </section>

      {error && (
        <p role="alert" className="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {completed && isLast ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-success/40 bg-success-soft p-5">
          <p className="flex items-center gap-2.5 font-semibold text-success">
            <CircleCheck aria-hidden className="size-5" />
            Dars tugatildi
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="outline">
              <Link href="/app/kurs">Kurs dasturi</Link>
            </Button>
            <Button asChild>
              <Link href="/app">Keyingi qadam</Link>
            </Button>
          </div>
        </div>
      ) : (
        <nav aria-label="Bosqichlar boʻyicha harakat" className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => showStep(viewStep - 1)} disabled={viewStep === 0 || pending}>
            <ArrowLeft aria-hidden />
            Oldingi
          </Button>
          {!isLast ? (
            <Button onClick={() => goTo(viewStep + 1)} loading={pending}>
              {viewStep + 1 <= maxReached ? "Keyingisi" : "Keyingi bosqich"}
            </Button>
          ) : isStudent ? (
            <Button onClick={finish} loading={pending}>
              Darsni tugatish
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/kirish?next=${encodeURIComponent(`/app/dars/${lesson.id}`)}`}>Natijani saqlash uchun kirish</Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}

function StepBody({ step, hasVideo, videoConfigured }: { step: LessonStep; hasVideo: boolean; videoConfigured: boolean }) {
  if (step.kind === "video") {
    return (
      <div className="space-y-4">
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface p-6 text-center">
          <VideoOff aria-hidden className="size-6 text-fg-subtle" />
          <p className="font-medium text-fg">{hasVideo ? "Video pleer hali ulanmagan" : "Bu darsga video hali yuklanmagan"}</p>
          <p className="max-w-sm text-sm text-fg-muted">Video provayder ulanmaguncha bu yerda soxta video koʻrsatilmaydi.</p>
          {!videoConfigured && <IntegrationBadge configured={false} />}
        </div>
        {step.bodyMd && <Markdown>{step.bodyMd}</Markdown>}
      </div>
    );
  }

  if (step.kind === "voice") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-surface px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <Headphones aria-hidden className="size-4" />
            Ovozli tushuntirish hali yozilmagan — quyida matni.
          </p>
          <IntegrationBadge configured={false} />
        </div>
        {step.bodyMd && <Markdown>{step.bodyMd}</Markdown>}
      </div>
    );
  }

  if (!step.bodyMd) return <p className="text-fg-muted">Bu bosqich mazmuni tayyorlanmoqda.</p>;

  return (
    <div className="space-y-4">
      <Markdown>{step.bodyMd}</Markdown>
      {EXERCISE_KINDS.has(step.kind) && (
        <p className="max-w-[68ch] rounded-control bg-surface px-4 py-3 text-sm text-fg-muted">
          Javobni shu yerda yuborish va avtomatik tekshirish mashqlar tizimi bilan ulanadi. Hozircha vazifani
          Claudeʼda bajaring va keyingi bosqichga oʻting.
        </p>
      )}
    </div>
  );
}
