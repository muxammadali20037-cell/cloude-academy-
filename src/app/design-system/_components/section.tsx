import { cn } from "@/lib/utils";

export function Section({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24", className)}>
      <div className="mb-6 max-w-[65ch]">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-fg">
          {title}
        </h2>
        <p className="mt-1.5 text-fg-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-medium text-fg-subtle">{children}</h3>;
}

/** Namuna ramkasi: komponent "ilovada qanday turishini" ko'rsatadi. */
export function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-panel border border-line bg-surface", className)}>
      {children}
    </div>
  );
}
