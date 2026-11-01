import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  phone: string | null;
};

/**
 * Joriy foydalanuvchi (Data Access Layer). Token Supabase kaliti bilan
 * imzosi tekshirilgan holda o'qiladi (getClaims). Bitta so'rov ichida
 * natija qayta ishlatiladi.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (error || !claims?.sub) return null;
    return {
      id: claims.sub,
      email: typeof claims.email === "string" && claims.email ? claims.email : null,
      phone: typeof claims.phone === "string" && claims.phone ? claims.phone : null,
    };
  } catch {
    return null;
  }
});

/** Himoyalangan sahifalar uchun: kirmagan bo'lsa kirish sahifasiga. */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/kirish?next=${encodeURIComponent(next)}`);
  return user;
}
