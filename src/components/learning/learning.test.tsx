import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedbackCard } from "./feedback-card";
import { DEFAULT_LESSON_STEPS, LessonPath } from "./lesson-path";
import { ProgressRing } from "./progress-ring";

describe("ProgressRing", () => {
  it("yangi talabada 0% ko'rsatadi", () => {
    render(<ProgressRing value={0} label="Umumiy progress" />);
    expect(screen.getByRole("img", { name: "Umumiy progress: 0%" })).toBeInTheDocument();
  });

  it("chegaradan tashqari qiymatlarni 0–100 ga cheklaydi", () => {
    const { rerender } = render(<ProgressRing value={140} label="Progress" />);
    expect(screen.getByRole("img", { name: "Progress: 100%" })).toBeInTheDocument();
    rerender(<ProgressRing value={-5} label="Progress" />);
    expect(screen.getByRole("img", { name: "Progress: 0%" })).toBeInTheDocument();
  });
});

describe("LessonPath", () => {
  it("topshiriqdagi 10 bosqichni chizadi va joriysini belgilaydi", () => {
    render(<LessonPath currentIndex={4} />);
    const items = within(screen.getByRole("navigation", { name: "Dars bosqichlari" })).getAllByRole("listitem");
    expect(items).toHaveLength(DEFAULT_LESSON_STEPS.length);
    expect(items[4]).toHaveAttribute("aria-current", "step");
    expect(items.filter((item) => item.dataset.status === "done")).toHaveLength(4);
    expect(screen.getByText("5-qadam, jami 10")).toBeInTheDocument();
  });

  it("noto'g'ri indeksni chegaraga keltiradi", () => {
    render(<LessonPath currentIndex={99} />);
    const items = screen.getAllByRole("listitem");
    expect(items.at(-1)).toHaveAttribute("aria-current", "step");
  });
});

describe("FeedbackCard", () => {
  const explanation = {
    whatWrong: "Siz A variantini tanladingiz.",
    why: "Vazifa hujjat ortida qoladi.",
    correctAnswer: "Hujjatdan keyin, eng oxirida",
    reason: "Uzun maʼlumot yuqorida, savol oxirida tursa sifat oshadi.",
    remember: "Avval material, keyin vazifa.",
  };

  it("xato javobda bo'limlarni belgilangan tartibda ko'rsatadi", () => {
    render(<FeedbackCard result="incorrect" explanation={explanation} onSimilar={() => {}} />);
    const titles = screen.getAllByRole("term").map((node) => node.textContent);
    expect(titles).toEqual(["Nima xato boʻldi", "Nega bu xato", "Toʻgʻri javob", "Nega aynan shu"]);
    expect(screen.getByText("Qanday eslab qolish")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Notoʻgʻri javob");
  });

  it("o'xshash mashq tugmasini chaqiradi", async () => {
    const onSimilar = vi.fn();
    render(<FeedbackCard result="incorrect" explanation={explanation} onSimilar={onSimilar} />);
    await userEvent.click(screen.getByRole("button", { name: "Oʻxshash mashq" }));
    expect(onSimilar).toHaveBeenCalledOnce();
  });

  it("to'g'ri javobda faqat sababni ko'rsatadi, xato bo'limlarisiz", () => {
    render(<FeedbackCard result="correct" explanation={{ reason: explanation.reason }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Toʻgʻri javob");
    expect(screen.queryByRole("term")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Oʻxshash mashq" })).not.toBeInTheDocument();
  });
});
