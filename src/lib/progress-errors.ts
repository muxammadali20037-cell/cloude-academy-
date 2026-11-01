/** Progress funksiyalari xatolarini talabaga tushunarli matnga aylantiradi. */
export function progressErrorMessage(message: string | undefined, minVideoPercent = 80): string {
  const text = message ?? "";
  if (text.includes("steps_incomplete")) return "Darsni tugatish uchun avval barcha bosqichlarni oʻting.";
  if (text.includes("video_incomplete")) return `Darsni tugatish uchun videoning kamida ${minVideoPercent}% qismini koʻring.`;
  if (text.includes("step_not_allowed")) return "Bosqichlarni ketma-ket oʻting: oldingi bosqich hali tugamagan.";
  if (text.includes("no_access")) return "Bu darsga kirish huquqingiz yoʻq.";
  if (text.includes("not_authenticated")) return "Sessiya tugagan. Qaytadan kiring.";
  if (text.includes("not_started")) return "Dars hali boshlanmagan. Sahifani yangilang.";
  if (text.includes("invalid_step")) return "Bunday bosqich yoʻq.";
  return "Progressni saqlab boʻlmadi. Internetni tekshirib, qayta urinib koʻring.";
}
