import "server-only";

/**
 * Tashqi servislar ro'yxati va ularning holati.
 *
 * Holat faqat muhit o'zgaruvchilari BOR-YO'QLIGIDAN aniqlanadi. Qiymatlar
 * hech qachon o'qib qaytarilmaydi va brauzerga yuborilmaydi. Kalit
 * kiritilmagan servis "NOT CONFIGURED" deb ko'rsatiladi — uning o'rniga
 * soxta natija ko'rsatilmaydi.
 */

type Env = Record<string, string | undefined>;

export type IntegrationId =
  | "supabase"
  | "anthropic"
  | "payme"
  | "click"
  | "telegram"
  | "video"
  | "tts"
  | "sms"
  | "monitoring";

export type IntegrationStatus = {
  id: IntegrationId;
  name: string;
  purpose: string;
  /** Qaysi fazada kerak bo'ladi (roadmap bo'yicha). */
  phase: number;
  configured: boolean;
  /** Yetishmayotgan o'zgaruvchilar NOMLARI (qiymatlar emas). */
  missing: string[];
  /** Tanlangan provayder (video va TTS uchun). */
  provider?: string;
};

type Definition = {
  id: IntegrationId;
  name: string;
  purpose: string;
  phase: number;
  /** Doim kerak bo'ladigan o'zgaruvchilar. */
  required: string[];
  /** Provayder tanlovi: o'zgaruvchi nomi va har bir provayder uchun kalitlar. */
  providers?: { selector: string; options: Record<string, string[]> };
};

const DEFINITIONS: Definition[] = [
  {
    id: "supabase",
    name: "Supabase",
    purpose: "Baza, kirish va fayllar",
    phase: 3,
    required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"],
  },
  {
    id: "anthropic",
    name: "Claude API",
    purpose: "AI mentor va baholash",
    phase: 5,
    required: ["ANTHROPIC_API_KEY"],
  },
  {
    id: "payme",
    name: "Payme",
    purpose: "Toʻlov qabul qilish",
    phase: 9,
    required: ["PAYME_MERCHANT_ID", "PAYME_KEY"],
  },
  {
    id: "click",
    name: "Click",
    purpose: "Toʻlov qabul qilish",
    phase: 9,
    required: ["CLICK_SERVICE_ID", "CLICK_MERCHANT_ID", "CLICK_MERCHANT_USER_ID", "CLICK_SECRET_KEY"],
  },
  {
    id: "telegram",
    name: "Telegram bot",
    purpose: "Bot, Mini App va eslatmalar",
    phase: 8,
    required: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"],
  },
  {
    id: "video",
    name: "Video provayder",
    purpose: "Dars videolari",
    phase: 3,
    required: [],
    providers: {
      selector: "VIDEO_PROVIDER",
      options: {
        bunny: ["BUNNY_STREAM_LIBRARY_ID", "BUNNY_STREAM_API_KEY", "BUNNY_TOKEN_AUTH_KEY"],
        mux: ["MUX_TOKEN_ID", "MUX_TOKEN_SECRET"],
      },
    },
  },
  {
    id: "tts",
    name: "Ovoz (TTS)",
    purpose: "Oʻzbekcha ovozli tushuntirish",
    phase: 6,
    required: [],
    providers: {
      selector: "TTS_PROVIDER",
      options: {
        voicelab: ["VOICELAB_API_KEY"],
        azure: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
        elevenlabs: ["ELEVENLABS_API_KEY"],
        aisha: ["AISHA_API_KEY"],
      },
    },
  },
  {
    id: "sms",
    name: "SMS provayder",
    purpose: "Telefon raqam orqali kirish kodi",
    phase: 3,
    required: ["SMS_PROVIDER_API_KEY"],
  },
  {
    id: "monitoring",
    name: "Sentry",
    purpose: "Xatolarni kuzatish",
    phase: 10,
    required: ["SENTRY_DSN"],
  },
];

/** Integratsiyalar ishlatadigan barcha o'zgaruvchi nomlari (.env.example bilan solishtirish uchun). */
export function listIntegrationEnvVars(): string[] {
  const names = DEFINITIONS.flatMap((definition) => [
    ...definition.required,
    ...(definition.providers
      ? [definition.providers.selector, ...Object.values(definition.providers.options).flat()]
      : []),
  ]);
  return [...new Set(names)];
}

function hasValue(env: Env, name: string) {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Barcha integratsiyalar holati. `env` testlarda almashtiriladi;
 * ilovada standart qiymat — process.env.
 */
export function getIntegrationStatuses(env: Env = process.env): IntegrationStatus[] {
  return DEFINITIONS.map((definition) => {
    let needed = [...definition.required];
    let provider: string | undefined;

    if (definition.providers) {
      const { selector, options } = definition.providers;
      const chosen = env[selector]?.trim().toLowerCase();
      if (chosen && chosen in options) {
        provider = chosen;
        needed = needed.concat(options[chosen]);
      } else {
        // Provayder tanlanmagan yoki noma'lum — tanlov o'zgaruvchisining o'zi yetishmaydi.
        needed = needed.concat(selector);
      }
    }

    const missing = needed.filter((name) => !hasValue(env, name) || (name === definition.providers?.selector && !provider));

    return {
      id: definition.id,
      name: definition.name,
      purpose: definition.purpose,
      phase: definition.phase,
      configured: missing.length === 0,
      missing,
      provider,
    };
  });
}
