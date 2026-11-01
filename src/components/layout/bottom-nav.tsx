import Link from "next/link";
import { cn } from "@/lib/utils";
import { STUDENT_NAV, isActive } from "./nav-items";

export type BottomNavProps = {
  currentPath: string;
  /** false — namuna rejimi: bandlar havola emas. */
  interactive?: boolean;
  /** "fixed" — ilovada ekran pastida; "static" — namunada joyida. */
  position?: "fixed" | "static";
  /** Menyu nomi (ekran o'quvchi uchun). */
  navLabel?: string;
  className?: string;
};

/** Mobil pastki menyu: 5 ta asosiy bo'lim, katta bosish maydonlari. */
export function BottomNav({
  currentPath,
  interactive = true,
  position = "fixed",
  navLabel = "Asosiy menyu",
  className,
}: BottomNavProps) {
  const items = STUDENT_NAV.filter((item) => item.mobile);

  return (
    <nav
      aria-label={navLabel}
      className={cn(
        "border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur",
        position === "fixed" && "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        className,
      )}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.href, currentPath);
          const Icon = item.icon;
          const classes = cn(
            "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
            active ? "text-accent-fg" : "text-fg-subtle hover:text-fg",
          );
          const content = (
            <>
              <Icon aria-hidden className="size-[1.375rem]" strokeWidth={active ? 2.1 : 1.75} />
              {item.label}
            </>
          );
          return (
            <li key={item.href}>
              {interactive ? (
                <Link
                  href={item.href}
                  className={classes}
                  aria-current={active ? "page" : undefined}
                >
                  {content}
                </Link>
              ) : (
                <span className={classes} aria-current={active ? "page" : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
