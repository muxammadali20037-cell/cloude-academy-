import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { requireUser } from "@/lib/auth";
import { getMyOverview, overallPercent } from "@/lib/data/learning";
import { DesktopNav, MobileNav } from "./_components/app-nav";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = {
  title: "Kabinet",
  robots: { index: false, follow: false },
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/app");
  const overview = await getMyOverview();
  const courseProgress = overview.status === "ok" ? overallPercent(overview.data) : null;

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <DesktopNav courseProgress={courseProgress} footer={<SignOutButton />} />

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
          <Link href="/app" className="rounded-control" aria-label="Kabinet bosh sahifasi">
            <Wordmark size={24} />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
