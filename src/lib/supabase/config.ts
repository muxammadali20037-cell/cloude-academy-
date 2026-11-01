/**
 * Supabase manzili va ochiq (publishable) kaliti. Ikkalasi ham brauzerga
 * chiqishi xavfsiz: ma'lumotlarni RLS qoidalari himoya qiladi.
 * Kiritilmagan bo'lsa null — sahifalar "NOT CONFIGURED" holatini ko'rsatadi.
 */
export type SupabaseConfig = { url: string; publishableKey: string };

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

/** Asosiy kurs (hozircha platformada bitta kurs). */
export const MAIN_COURSE_SLUG = "claude-masterclass";
