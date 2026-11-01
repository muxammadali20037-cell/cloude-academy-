/**
 * Kirishdan keyin qaytish manzilini tekshiradi: faqat shu saytning ichki
 * sahifalari. Tashqi saytga yo'naltirish (open redirect) hujumining oldini oladi.
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Boshqaruv belgilari va protokol nomlari taqiqlangan.
  if (/[\u0000-\u001f\u007f]/.test(value) || /^\/+[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;
  // Kirish sahifalarining o'ziga qaytmaymiz (cheksiz aylanish).
  if (value.startsWith("/kirish") || value.startsWith("/tasdiqlash")) return fallback;
  return value;
}
