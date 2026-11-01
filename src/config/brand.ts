/**
 * Brend sozlamalari — platforma nomi faqat shu yerda saqlanadi.
 *
 * "Claude" — Anthropic kompaniyasining savdo belgisi. Yakuniy brend nomi
 * tanlangach, faqat shu faylni o'zgartirish kifoya: sayt, metadata va
 * komponentlar nomni shu yerdan oladi.
 */
export const brand = {
  /** Ishchi nom. Yakuniy brend tanlangach almashtiriladi. */
  name: "Claude Academy",
  shortName: "Academy",
  tagline: "Claudeʼni oʻrganma. Uni boshqarishni oʻrgan.",
  /** Har bir ommaviy sahifa pastida ko'rsatiladi. */
  disclaimer:
    "Mustaqil taʼlim loyihasi. Anthropic bilan bogʻliq emas va u tomonidan tasdiqlanmagan.",
  locale: "uz",
} as const;

export type Brand = typeof brand;
