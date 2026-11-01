import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  {
    q: "Kurs kimlar uchun?",
    a: "Claudeʼdan ishda foydalanmoqchi boʻlgan har kim uchun: talabalar, freelancerlar, marketologlar, tadbirkorlar va dasturchilar. 1–2-darajalar dasturlash bilimini talab qilmaydi.",
  },
  {
    q: "Dasturlashni bilishim shartmi?",
    a: "Yoʻq. 3-darajadan boshlab Claude Code va API bilan ishlaymiz; terminal, Git va loyiha tuzilishi asoslari ham shu darajada oʻtiladi.",
  },
  {
    q: "Claude obunasi kerakmi?",
    a: "Asosiy mavzularni Claudeʼning bepul rejasida mashq qilish mumkin. Baʼzi imkoniyatlar pullik rejani talab qilishi mumkin — bunday darslarda bu alohida koʻrsatiladi.",
  },
  {
    q: "Kurs qaysi tilda?",
    a: "Oʻzbek tilida, lotin alifbosida. Claude interfeysidagi inglizcha atamalar asl holida qoldirilib, maʼnosi tushuntiriladi.",
  },
  {
    q: "Toʻlov qanday amalga oshiriladi?",
    a: "Click yoki Payme orqali. Toʻlov tizimi hozir ulanmoqda — kurs ochilganda narxlar shu saytda eʼlon qilinadi.",
  },
  {
    q: "Sertifikat beriladimi?",
    a: "Ha — barcha darslar, daraja imtihonlari va yakuniy loyihani bajarganlarga. Sertifikatda QR kod va unikal ID boʻladi, uni istalgan kishi saytda tekshira oladi.",
  },
  {
    q: "Darslar eskirib qolmaydimi?",
    a: "Claude tez yangilanadi, shuning uchun har bir dars rasmiy hujjatlar bilan tekshiriladi va tekshirilgan sanasi dars yonida koʻrsatiladi. Eskirgan funksiyalar alohida belgilanadi.",
  },
  {
    q: "Platforma Anthropicʼga tegishlimi?",
    a: "Yoʻq. Bu mustaqil taʼlim loyihasi, Anthropic bilan bogʻliq emas va u tomonidan tasdiqlanmagan.",
  },
];

export function Faq() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {QUESTIONS.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium text-fg [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown aria-hidden className="size-5 shrink-0 text-fg-subtle transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-[65ch] pb-6 text-fg-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
