import { BookOpen, Clock, Flame, Layers, Target, TrendingUp, UserPen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProgressRing } from "@/components/learning/progress-ring";
import { StatTile } from "@/components/learning/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { getMyOverview, getMyProfile, overallPercent, type CourseOverview } from "@/lib/data/learning";
import { DataUnavailable } from "./_components/data-state";

export const metadata: Metadata = { title: "Bosh sahifa" };

function firstName(fullName: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? null;
}

export default async function DashboardPage() {
  const user = await requireUser("/app");
  const [overview, profile] = await Promise.all([getMyOverview(), getMyProfile(user.id)]);
  const name = firstName(profile?.fullName ?? null);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {name ? `Salom, ${name}` : "Xush kelibsiz"}
          </h1>
          {overview.status === "ok" && <p className="mt-1.5 text-fg-muted">{overview.data.course_title}</p>}
        </div>
        {overview.status === "ok" &&
          (overview.data.has_access ? (
            <Badge variant="success">Kursga kirish ochiq</Badge>
          ) : (
            <Badge variant="outline">Bepul rejim</Badge>
          ))}
      </header>

      {!profile?.fullName && (
        <Card variant="sunken">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-3 text-sm text-fg">
              <UserPen aria-hidden className="size-5 shrink-0 text-fg-subtle" />
              Toʻliq ismingizni kiriting — u sertifikatda aynan shunday yoziladi.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/profil">Ismni kiritish</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {overview.status === "ok" ? <Overview data={overview.data} /> : <DataUnavailable status={overview.status} />}
    </div>
  );
}

function Overview({ data }: { data: CourseOverview }) {
  const percent = overallPercent(data);
  const remaining = Math.max(0, data.total_lessons - data.completed_lessons);

  return (
    <>
      <section aria-labelledby="next-title" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <NextStep data={data} />
        <Card className="flex items-center gap-5 p-5 sm:p-6 lg:w-80">
          <ProgressRing value={percent} label="Umumiy progress" size={104} />
          <div>
            <p className="text-sm text-fg-muted">Umumiy progress</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fg">
              {data.completed_lessons} / {data.total_lessons} dars
            </p>
          </div>
        </Card>
      </section>

      <section aria-label="Statistika" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Oʻtilgan darslar" value={data.completed_lessons} unit={`/ ${data.total_lessons}`} icon={BookOpen} />
        <StatTile label="Tugatilgan modullar" value={data.completed_modules} unit={`/ ${data.total_modules}`} icon={Layers} />
        <StatTile
          label="Joriy daraja"
          value={data.current_level ?? "—"}
          hint={data.current_level ? undefined : "Hali boshlanmagan"}
          icon={TrendingUp}
        />
        <StatTile label="Test natijalari" value="—" hint="Testlar mashqlar tizimi bilan ulanadi" icon={Target} />
        <StatTile label="Oʻqish vaqti" value={data.learning_minutes} unit="daq" icon={Clock} />
        <StatTile label="Ketma-ket kunlar" value={data.streak_days} icon={Flame} />
      </section>

      <section aria-labelledby="cert-title" className="rounded-card border border-line p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cert-title" className="font-semibold text-fg">
            Sertifikatgacha
          </h2>
          <p className="text-sm tabular-nums text-fg-muted">
            {remaining === 0 && data.total_lessons > 0 ? "Barcha darslar tugatildi" : `${remaining} ta dars qoldi`}
          </p>
        </div>
        <Progress value={percent} label="Sertifikatgacha progress" />
        <p className="mt-3 text-sm text-fg-subtle">
          Sertifikat barcha darslar, daraja imtihonlari va yakuniy loyiha bajarilgandan keyin beriladi.
        </p>
      </section>
    </>
  );
}

function NextStep({ data }: { data: CourseOverview }) {
  if (data.next_lesson) {
    const started = data.in_progress_lessons > 0;
    return (
      <Card variant="accent" className="flex flex-col justify-between gap-6 p-5 sm:p-6">
        <div>
          <p id="next-title" className="text-sm font-medium text-accent-fg">
            {started ? "Davom ettiring" : "Keyingi dars"}
          </p>
          <p className="mt-1 text-sm text-fg-muted">{data.next_lesson.level_number}-daraja</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-fg">{data.next_lesson.title}</p>
        </div>
        <div>
          <Button asChild size="lg">
            <Link href={`/app/dars/${data.next_lesson.id}`}>{started ? "Davom ettirish" : "Darsni boshlash"}</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (!data.has_access) {
    return (
      <Card className="flex flex-col justify-between gap-6 p-5 sm:p-6">
        <div>
          <h2 id="next-title" className="text-xl font-semibold tracking-tight text-fg">
            Kursga kirish hali ochilmagan
          </h2>
          <p className="mt-2 max-w-[60ch] text-fg-muted">
            {data.published_lessons > 0
              ? "Bepul darslar tugadi. Toʻliq kursga kirish uchun tarif tanlang."
              : "Darslar tayyorlanmoqda. Toʻlov tizimi ishga tushgach, tarifni shu yerdan tanlaysiz."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/narxlar">Tariflarni koʻrish</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/kurs">Dasturni koʻrish</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col justify-between gap-6 p-5 sm:p-6">
      <div>
        <h2 id="next-title" className="text-xl font-semibold tracking-tight text-fg">
          {data.completed_lessons > 0 ? "Hozircha hamma darslar tugatildi" : "Darslar tayyorlanmoqda"}
        </h2>
        <p className="mt-2 max-w-[60ch] text-fg-muted">
          Yangi darslar nashr qilinishi bilan shu yerda paydo boʻladi.
        </p>
      </div>
      <div>
        <Button asChild variant="outline">
          <Link href="/app/kurs">Kurs dasturini koʻrish</Link>
        </Button>
      </div>
    </Card>
  );
}
