"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Email orqali bir martalik kod bilan kirish (parolsiz).
 * Yangi foydalanuvchi shu yo'l bilan avtomatik ro'yxatdan o'tadi.
 * Email manzil URL'da emas, qisqa muddatli httpOnly cookie'da saqlanadi.
 */

const OTP_EMAIL_COOKIE = "otp_email";
const OTP_NEXT_COOKIE = "otp_next";
const OTP_COOKIE_MAX_AGE = 60 * 15;

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string; field?: "email" | "code" }
  | { status: "sent"; message: string };

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
const codeSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{6}$/));

const NOT_CONFIGURED: AuthFormState = {
  status: "error",
  message: "Kirish tizimi hali ulanmagan. Administrator Supabase sozlamalarini kiritishi kerak.",
};

async function otpCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OTP_COOKIE_MAX_AGE,
  };
}

export async function requestEmailCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) {
    return { status: "error", field: "email", message: "Email manzilini toʻgʻri kiriting, masalan ism@misol.uz" };
  }
  const next = safeNextPath(formData.get("next"));

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { status: "error", message: authErrorMessage(error) };

  const store = await cookies();
  const options = await otpCookieOptions();
  store.set(OTP_EMAIL_COOKIE, parsed.data, options);
  store.set(OTP_NEXT_COOKIE, next, options);
  redirect("/tasdiqlash");
}

export async function verifyEmailCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const store = await cookies();
  const email = store.get(OTP_EMAIL_COOKIE)?.value;
  if (!email) redirect("/kirish");

  const parsed = codeSchema.safeParse(formData.get("code") ?? "");
  if (!parsed.success) {
    return { status: "error", field: "code", message: "Kod 6 ta raqamdan iborat. Xatdagi kodni kiriting." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.verifyOtp({ email, token: parsed.data, type: "email" });
  if (error) return { status: "error", field: "code", message: authErrorMessage(error) };

  const next = safeNextPath(store.get(OTP_NEXT_COOKIE)?.value);
  store.delete(OTP_EMAIL_COOKIE);
  store.delete(OTP_NEXT_COOKIE);
  redirect(next);
}

export async function resendEmailCode(): Promise<AuthFormState> {
  const store = await cookies();
  const email = store.get(OTP_EMAIL_COOKIE)?.value;
  if (!email) redirect("/kirish");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { status: "error", message: authErrorMessage(error) };
  return { status: "sent", message: "Yangi kod yuborildi. Pochtangizni tekshiring." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
