/**
 * Ssenariy xeshi: audio qaysi matndan yaratilganini aniqlash uchun.
 * Ssenariy o'zgarsa, xesh o'zgaradi va eski audio ishlatilmaydi.
 * Faqat Node'da (generator va testlar) ishlatiladi.
 */
import { createHash } from "node:crypto";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

export function scriptHash(script: unknown) {
  return createHash("sha256").update(JSON.stringify(canonical(script))).digest("hex");
}
