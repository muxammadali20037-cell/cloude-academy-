"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { ChoiceGroup, ChoiceOption, type ChoiceResult } from "@/components/learning/choice-option";
import { FeedbackCard } from "@/components/learning/feedback-card";
import { Button } from "@/components/ui/button";

type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctId: string;
  why: string;
  reason: string;
  remember: string;
};

/**
 * Namuna savollar. Mazmuni Anthropic'ning uzun kontekst bo'yicha
 * tavsiyalariga asoslangan: uzun hujjat yuqorida, savol oxirida;
 * bir nechta hujjat XML teglari bilan ajratiladi.
 */
const QUESTIONS: Question[] = [
  {
    id: "long-context-order",
    prompt:
      "Claudeʼga 50 sahifalik shartnomani berib, undagi xavfli bandlarni topishni soʻramoqchisiz. Savolni promptning qayeriga yozgan maʼqul?",
    options: [
      { id: "a", text: "Hujjatdan oldin, eng boshida" },
      { id: "b", text: "Hujjatdan keyin, eng oxirida" },
      { id: "c", text: "Hujjatning oʻrtasida" },
      { id: "d", text: "Farqi yoʻq, natija bir xil boʻladi" },
    ],
    correctId: "b",
    why: "Uzun matnda vazifa boshida qolsa, u hujjatning minglab soʻzlari ortida qoladi. Bu javob sifatini pasaytirishi mumkin.",
    reason:
      "Anthropic hujjatlarida uzun maʼlumotni promptning yuqorisiga, savol va koʻrsatmalarni esa oxiriga joylash tavsiya qilinadi. Bu ayniqsa murakkab, koʻp hujjatli soʻrovlarda sifatni oshiradi.",
    remember: "Avval material, keyin vazifa — imtihonda avval matnni, keyin savolni oʻqiganingiz kabi.",
  },
  {
    id: "multi-document",
    prompt:
      "Uchta choraklik hisobotni solishtirib, umumiy xulosa soʻramoqchisiz. Promptni qanday tuzasiz?",
    options: [
      { id: "a", text: "Avval vazifa va savol, keyin uchta hisobot" },
      { id: "b", text: "Uchta hisobot, har biri alohida <document> tegida, keyin vazifa va savol" },
      { id: "c", text: "Uchta hisobotni bitta matnga aralashtirib, savolni oʻrtasiga yozaman" },
    ],
    correctId: "b",
    why: "Hujjatlar aralashib ketsa yoki vazifa boshida qolsa, Claude qaysi maʼlumot qaysi hisobotdan ekanini ajratishi qiyinlashadi.",
    reason:
      "Hujjatlar yuqorida, vazifa oxirida turadi. Har bir hujjatni XML teglari bilan ajratish (masalan, <document>, ichida manba va mazmun) Claudeʼga manbalarni aniq farqlashga yordam beradi.",
    remember: "Har bir hujjatga oʻz qutisi: teg bilan oʻrang, nomini yozing, savolni eng oxirida bering.",
  },
];

export function LiveExercise() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [graded, setGraded] = useState(false);

  const question = QUESTIONS[questionIndex];
  const isCorrect = graded && selected === question.correctId;
  const chosenText = question.options.find((option) => option.id === selected)?.text ?? "";
  const correctText = question.options.find((option) => option.id === question.correctId)?.text ?? "";
  const hasNext = questionIndex < QUESTIONS.length - 1;

  function resultFor(optionId: string): ChoiceResult | undefined {
    if (!graded) return undefined;
    if (optionId === question.correctId) return "correct";
    if (optionId === selected) return "incorrect";
    return "neutral";
  }

  function goTo(index: number) {
    setQuestionIndex(index);
    setSelected("");
    setGraded(false);
  }

  function retry() {
    setSelected("");
    setGraded(false);
  }

  const promptId = `${question.id}-prompt`;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-sm text-fg-subtle">
          Savol {questionIndex + 1}, jami {QUESTIONS.length}
        </p>
        <p id={promptId} className="max-w-[65ch] text-lg font-medium leading-snug text-fg">
          {question.prompt}
        </p>
      </div>

      <ChoiceGroup
        key={question.id}
        aria-labelledby={promptId}
        value={selected}
        onValueChange={setSelected}
      >
        {question.options.map((option, index) => (
          <ChoiceOption
            key={option.id}
            value={option.id}
            marker={String.fromCharCode(65 + index)}
            result={resultFor(option.id)}
          >
            {option.text}
          </ChoiceOption>
        ))}
      </ChoiceGroup>

      {!graded && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setGraded(true)} disabled={!selected}>
            Tekshirish
          </Button>
          {!selected && <p className="text-sm text-fg-subtle">Avval javobni tanlang</p>}
        </div>
      )}

      {graded && (
        <FeedbackCard
          result={isCorrect ? "correct" : "incorrect"}
          explanation={
            isCorrect
              ? { reason: question.reason, remember: question.remember }
              : {
                  whatWrong: `Siz “${chosenText}” variantini tanladingiz.`,
                  why: question.why,
                  correctAnswer: correctText,
                  reason: question.reason,
                  remember: question.remember,
                }
          }
          onSimilar={!isCorrect && hasNext ? () => goTo(questionIndex + 1) : undefined}
          action={
            isCorrect ? (
              hasNext ? (
                <Button size="sm" onClick={() => goTo(questionIndex + 1)}>
                  Keyingi savol
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => goTo(0)}>
                  <RotateCcw aria-hidden />
                  Boshidan boshlash
                </Button>
              )
            ) : (
              <Button size="sm" variant="ghost" onClick={retry}>
                Qayta urinish
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
