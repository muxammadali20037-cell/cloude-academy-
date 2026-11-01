"use client";

import { MotionConfig } from "motion/react";

/** Foydalanuvchi "kamroq harakat" tanlagan bo'lsa, Motion animatsiyalari o'chadi. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
