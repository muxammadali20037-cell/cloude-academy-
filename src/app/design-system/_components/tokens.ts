/** Dizayn tizimi sahifasida ko'rsatiladigan tokenlar (globals.css bilan bir xil). */

export type SemanticToken = {
  name: string;
  cssVar: string;
  role: string;
  light: string;
  dark: string;
  /** Asosiy juftlikdagi kontrast (WCAG), hisoblab tekshirilgan. */
  contrast?: string;
};

export const SEMANTIC_TOKENS: SemanticToken[] = [
  { name: "canvas", cssVar: "--canvas", role: "Sahifa foni", light: "#FFFFFF", dark: "#0A1030" },
  { name: "surface", cssVar: "--surface", role: "Ikkinchi darajali blok", light: "#F4F5FA", dark: "#111A40" },
  { name: "fg", cssVar: "--fg", role: "Asosiy matn", light: "#0A1030", dark: "#EEF0FA", contrast: "18.6 / 16.4" },
  { name: "fg-muted", cssVar: "--fg-muted", role: "Izoh matni", light: "#4A5274", dark: "#A6ADCB", contrast: "7.6 / 8.4" },
  { name: "fg-subtle", cssVar: "--fg-subtle", role: "Yordamchi matn", light: "#5F6789", dark: "#8890B0", contrast: "5.5 / 5.9" },
  { name: "primary", cssVar: "--primary", role: "Asosiy harakat, progress", light: "#6440F0", dark: "#6440F0", contrast: "5.9 oq matn bilan" },
  { name: "accent-soft", cssVar: "--accent-soft", role: "Faol element foni", light: "#F3F0FF", dark: "#221A5C" },
  { name: "line", cssVar: "--line", role: "Bezak chegarasi", light: "#E1E4EE", dark: "#222D5E" },
  { name: "line-strong", cssVar: "--line-strong", role: "Input chegarasi", light: "#7F87A6", dark: "#66709C", contrast: "3.6 / 3.9" },
  { name: "success", cssVar: "--success", role: "Toʻgʻri javob", light: "#0F7A55", dark: "#45D29B", contrast: "5.3 / 9.7" },
  { name: "danger", cssVar: "--danger", role: "Xato", light: "#C2283F", dark: "#FF7A8C", contrast: "5.7 / 7.5" },
  { name: "warning", cssVar: "--warning", role: "Ogohlantirish", light: "#8A5A00", dark: "#F2B544", contrast: "5.4 / 10.2" },
];

export const NAVY_SCALE = [
  ["50", "#F4F5FA"],
  ["100", "#EBEDF5"],
  ["200", "#E1E4EE"],
  ["300", "#C9CEE0"],
  ["400", "#8890B0"],
  ["500", "#5F6789"],
  ["600", "#4A5274"],
  ["700", "#222D5E"],
  ["800", "#182250"],
  ["900", "#111A40"],
  ["950", "#0A1030"],
] as const;

export const VIOLET_SCALE = [
  ["50", "#F3F0FF"],
  ["100", "#E6E0FF"],
  ["200", "#CEC2FF"],
  ["300", "#B9A9FF"],
  ["400", "#9C85FF"],
  ["500", "#7B5CFF"],
  ["600", "#6440F0"],
  ["700", "#5230D6"],
  ["800", "#3F23A8"],
  ["900", "#221A5C"],
] as const;

export const TYPE_SCALE = [
  { token: "text-5xl", px: 49, sample: "Claudeʼni oʻrganma", className: "text-5xl font-semibold tracking-[-0.025em]" },
  { token: "text-4xl", px: 39, sample: "Uni boshqarishni oʻrgan", className: "text-4xl font-semibold tracking-[-0.02em]" },
  { token: "text-3xl", px: 31, sample: "Prompt va kontekst muhandisligi", className: "text-3xl font-semibold tracking-[-0.015em]" },
  { token: "text-2xl", px: 25, sample: "2-daraja: amaliy mashqlar", className: "text-2xl font-semibold tracking-tight" },
  { token: "text-xl", px: 20, sample: "Claude Projects yaratish", className: "text-xl font-semibold" },
  { token: "text-base", px: 16, sample: "Har bir darsda bajariladigan topshiriq bor.", className: "text-base" },
  { token: "text-sm", px: 14, sample: "Izoh va yordamchi matn", className: "text-sm text-fg-muted" },
  { token: "text-xs", px: 12, sample: "Kichik belgilar", className: "text-xs text-fg-subtle" },
] as const;
