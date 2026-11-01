import { describe, expect, it } from "vitest";
import { overallPercent } from "./data/learning";
import { progressErrorMessage } from "./progress-errors";

describe("progressErrorMessage", () => {
  it("bazadagi xato kodlarini o'zbekcha tushuntiradi", () => {
    expect(progressErrorMessage("steps_incomplete")).toContain("barcha bosqichlarni");
    expect(progressErrorMessage("video_incomplete", 80)).toContain("80%");
    expect(progressErrorMessage("step_not_allowed")).toContain("ketma-ket");
    expect(progressErrorMessage("no_access")).toContain("kirish huquqingiz");
  });

  it("noma'lum xatoda umumiy matn qaytaradi", () => {
    expect(progressErrorMessage("connection reset by peer")).toContain("qayta urinib");
  });
});

describe("overallPercent", () => {
  it("yangi talabada 0%, bo'sh dasturda ham 0%", () => {
    expect(overallPercent({ completed_lessons: 0, total_lessons: 90 })).toBe(0);
    expect(overallPercent({ completed_lessons: 0, total_lessons: 0 })).toBe(0);
  });

  it("butun foizga yaxlitlaydi", () => {
    expect(overallPercent({ completed_lessons: 1, total_lessons: 90 })).toBe(1);
    expect(overallPercent({ completed_lessons: 45, total_lessons: 90 })).toBe(50);
  });
});
