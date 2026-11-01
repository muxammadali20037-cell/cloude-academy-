import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { STUDENT_NAV, isActive, type NavItem } from "./nav-items";

export type AppSidebarProps = {
  currentPath: string;
  /** Kurs progressi (0–100). null — talaba hali kursga yozilmagan. */
  courseProgress: number | null;
  /**
   * false bo'lsa bandlar havola emas, oddiy element bo'lib chiziladi
   * (masalan, dizayn tizimi sahifasidagi namuna uchun).
   */
  interactive?: boolean;
  /** Namunada "div", ilovada "aside" (sahifada bitta asosiy menyu bo'lishi uchun). */
  as?: "aside" | "div";
  /** Menyu nomi (ekran o'quvchi uchun). */
  navLabel?: string;
  className?: string;
};

export function AppSidebar({
  currentPath,
  courseProgress,
  interactive = true,
  as: Root = "aside",
  navLabel = "Asosiy menyu",
  className,
}: AppSidebarProps) {
  return (
    <Root className={cn("flex h-full w-64 flex-col border-r border-line bg-canvas", className)}>
      <div className="px-5 pb-6 pt-5">
        <Wordmark />
      </div>

      <nav aria-label={navLabel} className="flex-1 px-3">
        <ul className="space-y-0.5">
          {STUDENT_NAV.map((item) => (
            <li key={item.href}>
              <SidebarItem
                item={item}
                active={isActive(item.href, currentPath)}
                interactive={interactive}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4 border-t border-line p-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-fg-muted">Kurs progressi</span>
            {courseProgress !== null && (
              <span className="font-medium tabular-nums text-fg">{Math.round(courseProgress)}%</span>
            )}
          </div>
          {courseProgress !== null ? (
            <Progress value={courseProgress} label="Kurs progressi" />
          ) : (
            <p className="text-xs text-fg-subtle">Kursga hali yozilmagansiz</p>
          )}
        </div>
        <ThemeToggle />
      </div>
    </Root>
  );
}

function SidebarItem({
  item,
  active,
  interactive,
}: {
  item: NavItem;
  active: boolean;
  interactive: boolean;
}) {
  const Icon = item.icon;
  const classes = cn(
    "relative flex h-10 items-center gap-3 rounded-control px-3 text-[0.9375rem] transition-colors",
    active
      ? "bg-accent-soft font-medium text-accent-fg"
      : "text-fg-muted hover:bg-surface hover:text-fg",
  );
  const content = (
    <>
      {active && (
        <span aria-hidden className="absolute inset-y-2 -left-3 w-[3px] rounded-r-full bg-primary" />
      )}
      <Icon aria-hidden className="size-[1.125rem]" strokeWidth={active ? 2 : 1.75} />
      {item.label}
    </>
  );

  if (!interactive) {
    return (
      <span className={classes} aria-current={active ? "page" : undefined}>
        {content}
      </span>
    );
  }

  return (
    <Link href={item.href} className={classes} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  );
}
