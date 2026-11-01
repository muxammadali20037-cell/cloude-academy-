import { Clock, ExternalLink, ListChecks, ShieldCheck } from "lucide-react";
import type { LessonDetail } from "@/lib/data/learning";

const dateFormat = new Intl.DateTimeFormat("uz-Latn-UZ", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tashkent" });

/** Dars haqida: vaqt, tugatish shartlari, manbalar va tekshirilgan sana. */
export function LessonAside({ lesson }: { lesson: LessonDetail }) {
  const hasVideo = lesson.media.some((item) => item.kind === "video");
  return (
    <aside aria-label="Dars haqida" className="space-y-5 rounded-card bg-surface p-5 text-sm">
      {lesson.estimatedMinutes && (
        <p className="flex items-center gap-2.5 text-fg">
          <Clock aria-hidden className="size-4 text-fg-subtle" />
          Taxminan {lesson.estimatedMinutes} daqiqa
        </p>
      )}

      <div>
        <p className="flex items-center gap-2.5 font-medium text-fg">
          <ListChecks aria-hidden className="size-4 text-fg-subtle" />
          Dars qachon tugaydi
        </p>
        <ul className="mt-2 space-y-1 pl-[1.625rem] text-fg-muted">
          {lesson.completionRule.requireAllSteps && <li>Barcha {lesson.steps.length} ta bosqich oʻtilganda</li>}
          {hasVideo && lesson.completionRule.minVideoPercent > 0 && (
            <li>Videoning kamida {lesson.completionRule.minVideoPercent}% qismi koʻrilganda</li>
          )}
        </ul>
      </div>

      {(lesson.sourceUrls.length > 0 || lesson.verifiedAt) && (
        <div>
          <p className="flex items-center gap-2.5 font-medium text-fg">
            <ShieldCheck aria-hidden className="size-4 text-fg-subtle" />
            Manbalar
          </p>
          {lesson.verifiedAt && (
            <p className="mt-1 pl-[1.625rem] text-fg-subtle">
              Rasmiy hujjatlar bilan tekshirilgan: {dateFormat.format(new Date(lesson.verifiedAt))}
            </p>
          )}
          <ul className="mt-2 space-y-1.5 pl-[1.625rem]">
            {lesson.sourceUrls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-accent-fg underline-offset-4 hover:underline"
                >
                  {url.replace(/^https?:\/\//, "")}
                  <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
