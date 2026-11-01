/**
 * Platforma imkoniyatlari va ularning HAQIQIY holati. Imkoniyat ishga
 * tushganda shu yerda "ready" qilinadi — landing avtomatik yangilanadi.
 */
export type FeatureStatus = "ready" | "building";

export type Feature = {
  title: string;
  description: string;
  status: FeatureStatus;
};

export const FEATURES: Feature[] = [
  {
    title: "Bosqichma-bosqich darslar",
    description: "Har bir dars 10 qismdan iborat yoʻl: koʻrasiz, bajarasiz, tushunasiz. Bosqichlar ketma-ket ochiladi.",
    status: "ready",
  },
  {
    title: "Shaxsiy kabinet va progress",
    description: "Oʻtilgan darslar, modullar, oʻqish vaqti va ketma-ket kunlar — faqat sizning haqiqiy natijangiz.",
    status: "ready",
  },
  {
    title: "Interaktiv mashqlar va avtomatik tekshiruv",
    description: "Test, prompt yozish va amaliy vazifalar shu sahifada bajariladi va aniq mezonlar boʻyicha tekshiriladi.",
    status: "building",
  },
  {
    title: "Xatolar tahlili",
    description: "Notoʻgʻri javobda nima xato, nega xato, toʻgʻrisi nima va qanday eslab qolish koʻrsatiladi.",
    status: "building",
  },
  {
    title: "AI mentor",
    description: "Darajangiz, xatolaringiz va joriy darsingizni biladigan shaxsiy yordamchi.",
    status: "building",
  },
  {
    title: "Oʻzbekcha ovozli ustoz va video",
    description: "Ovozli tushuntirish, subtitr, transkript va ekran yozuvlari bilan koʻrsatma.",
    status: "building",
  },
  {
    title: "Telegram Mini App",
    description: "Darslar, eslatmalar va progress — Telegramʼning ichida.",
    status: "building",
  },
  {
    title: "Tekshiriladigan sertifikat",
    description: "QR kod va unikal ID orqali haqiqiyligini istalgan kishi tekshira oladi.",
    status: "building",
  },
];

/**
 * Toʻlov sahifasi (checkout) ishga tushganmi. 9-fazada Click va Payme
 * ulanib, sinovdan oʻtgach true qilinadi. Ungacha tarif tugmalari bloklanadi.
 */
export const CHECKOUT_READY = false;
