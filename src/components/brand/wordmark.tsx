import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Platforma belgisi: ko'tariluvchi zinapoya — noldan professional darajagacha
 * bo'lgan yo'l. Anthropic yoki Claude logotipi ishlatilmaydi.
 */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={cn("shrink-0", className)}
    >
      <rect width="28" height="28" rx="8" fill="var(--primary)" />
      <path
        d="M7 20.5h4.5V16H16v-4.5h5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="7.5" r="2" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <span className="text-[1.0625rem] font-semibold tracking-tight text-fg">{brand.name}</span>
    </span>
  );
}
