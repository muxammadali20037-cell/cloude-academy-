"use client";

import { motion } from "motion/react";
import { clamp, cn } from "@/lib/utils";

export type ProgressRingProps = {
  /** 0–100. Bazadan kelgan haqiqiy qiymat; yangi talabada 0. */
  value: number;
  /** Ekran o'quvchi uchun nom: "Umumiy progress". */
  label: string;
  size?: number;
  strokeWidth?: number;
  /** Markazdagi foiz yozuvi. */
  showValue?: boolean;
  className?: string;
};

export function ProgressRing({
  value,
  label,
  size = 112,
  strokeWidth = 10,
  showValue = true,
  className,
}: ProgressRingProps) {
  const safe = clamp(value, 0, 100);
  const percent = Math.round(safe);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe / 100);

  return (
    <div
      role="img"
      aria-label={`${label}: ${percent}%`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // 0% da yumaloq uchli nuqta ko'rinmasligi uchun chiziq yashiriladi.
          strokeOpacity={safe === 0 ? 0 : 1}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {showValue && (
        <span
          aria-hidden
          className="absolute font-semibold tabular-nums tracking-tight text-fg"
          style={{ fontSize: Math.max(12, size * 0.22) }}
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
