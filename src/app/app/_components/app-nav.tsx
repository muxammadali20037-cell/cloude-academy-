"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

/** Joriy sahifani bilib, menyuning faol bandini belgilaydi. */
export function DesktopNav({ courseProgress, footer }: { courseProgress: number | null; footer?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AppSidebar
      currentPath={pathname}
      courseProgress={courseProgress}
      footer={footer}
      className="sticky top-0 hidden h-dvh lg:flex"
    />
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return <BottomNav currentPath={pathname} />;
}
