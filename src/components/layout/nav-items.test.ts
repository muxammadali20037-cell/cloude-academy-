import { describe, expect, it } from "vitest";
import { STUDENT_NAV, isActive } from "./nav-items";

describe("isActive", () => {
  it("bosh sahifa faqat aynan /app da faol", () => {
    expect(isActive("/app", "/app")).toBe(true);
    expect(isActive("/app", "/app/kurs")).toBe(false);
  });

  it("ichki sahifalarda bo'lim faol qoladi", () => {
    expect(isActive("/app/kurs", "/app/kurs/1/2")).toBe(true);
    expect(isActive("/app/kurs", "/app/kursx")).toBe(false);
  });

  it("mobil menyuda 5 tadan ko'p band yo'q", () => {
    expect(STUDENT_NAV.filter((item) => item.mobile).length).toBeLessThanOrEqual(5);
  });
});
