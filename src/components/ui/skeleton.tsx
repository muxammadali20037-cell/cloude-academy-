import { cn } from "@/lib/utils";

/** Ma'lumot yuklanayotgan joy. Haqiqiy ma'lumot o'rniga soxta raqam qo'yilmaydi. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-control bg-surface-2", className)}
      {...props}
    />
  );
}
