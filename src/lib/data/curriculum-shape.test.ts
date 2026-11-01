import { describe, expect, it } from "vitest";
import { formatPriceUzs, freePreviewLessons, sortCurriculum, type RawCourse } from "./curriculum-shape";

const raw: RawCourse = {
  id: "c1",
  slug: "claude-masterclass",
  title: "Claude Masterclass",
  subtitle: null,
  description: null,
  course_levels: [
    {
      id: "l2",
      number: 2,
      title: "Ikkinchi",
      description: null,
      modules: [{ id: "m3", title: "M3", sort_order: 0, lessons: [{ id: "x", title: "X", status: "planned", is_free_preview: false, sort_order: 0, estimated_minutes: null }] }],
    },
    {
      id: "l1",
      number: 1,
      title: "Birinchi",
      description: null,
      modules: [
        {
          id: "m2",
          title: "M2",
          sort_order: 1,
          lessons: [{ id: "c", title: "C", status: "planned", is_free_preview: false, sort_order: 0, estimated_minutes: null }],
        },
        {
          id: "m1",
          title: "M1",
          sort_order: 0,
          lessons: [
            { id: "b", title: "B", status: "published", is_free_preview: false, sort_order: 1, estimated_minutes: 12 },
            { id: "a", title: "A", status: "published", is_free_preview: true, sort_order: 0, estimated_minutes: 8 },
          ],
        },
      ],
    },
  ],
};

describe("sortCurriculum", () => {
  it("daraja, modul va darslarni tartiblaydi va sanaydi", () => {
    const c = sortCurriculum(raw);
    expect(c.levels.map((l) => l.number)).toEqual([1, 2]);
    expect(c.levels[0].modules.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(c.levels[0].modules[0].lessons.map((l) => l.id)).toEqual(["a", "b"]);
    expect(c.levels[0].lessonCount).toBe(3);
    expect(c.lessonCount).toBe(4);
    expect(c.publishedLessonCount).toBe(2);
  });

  it("faqat nashr qilingan bepul darslarni ajratadi", () => {
    expect(freePreviewLessons(sortCurriculum(raw)).map((l) => l.id)).toEqual(["a"]);
  });
});

describe("formatPriceUzs", () => {
  it("tiyinni so'mga aylantirib, minglarni uzilmaydigan bo'sh joy bilan ajratadi", () => {
    expect(formatPriceUzs(49_000_000)).toBe("490\u00a0000\u00a0soʻm");
    expect(formatPriceUzs(0)).toBe("0\u00a0soʻm");
    expect(formatPriceUzs(12_345_678_900)).toBe("123\u00a0456\u00a0789\u00a0soʻm");
  });
});
