import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

/**
 * Foydalanuvchi sessiyasi bilan ishlaydigan server klienti.
 * So'rovlar foydalanuvchi nomidan bajariladi — RLS qoidalari amal qiladi.
 */
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component ichida cookie yozib bo'lmaydi — sessiyani proxy yangilaydi.
        }
      },
    },
  });
}

/**
 * Sessiyasiz klient: ochiq ma'lumotlar uchun (landing, dastur, tariflar).
 * Har doim "anon" sifatida ishlaydi.
 */
export function createSupabasePublicClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
