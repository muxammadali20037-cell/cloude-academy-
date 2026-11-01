/**
 * Supabase Auth xatolarini talabaga tushunarli o'zbekcha matnga aylantiradi.
 * Matn nima bo'lganini va nima qilish kerakligini aytadi.
 */
type AuthLikeError = { code?: string | null; status?: number | null; name?: string | null; message?: string | null };

export function authErrorMessage(error: AuthLikeError | null | undefined): string {
  if (!error) return "Kutilmagan xato. Birozdan keyin qayta urinib koʻring.";
  const code = error.code ?? "";

  if (code.startsWith("over_") || error.status === 429) {
    return "Juda koʻp urinish boʻldi. Bir daqiqa kutib, qayta urinib koʻring.";
  }
  if (code === "otp_expired" || code === "invalid_credentials" || code === "bad_code_verifier") {
    return "Kod notoʻgʻri yoki muddati oʻtgan. Kodni tekshiring yoki yangi kod soʻrang.";
  }
  if (code === "email_address_invalid" || code === "validation_failed") {
    return "Email manzilini tekshiring: u ism@misol.uz koʻrinishida boʻlishi kerak.";
  }
  if (code === "email_address_not_authorized") {
    return "Bu manzilga hozircha xat yuborib boʻlmaydi: platformaning email xizmati hali toʻliq sozlanmagan.";
  }
  if (code === "signup_disabled" || code === "otp_disabled") {
    return "Roʻyxatdan oʻtish vaqtincha yopiq. Keyinroq urinib koʻring.";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "Kirish tizimiga ulanib boʻlmadi. Internetni tekshirib, qayta urinib koʻring.";
  }
  return "Kutilmagan xato. Birozdan keyin qayta urinib koʻring.";
}
