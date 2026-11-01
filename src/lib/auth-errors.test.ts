import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-errors";
import { safeNextPath } from "./safe-redirect";

describe("authErrorMessage", () => {
  it("tezlik cheklovi uchun kutishni so'raydi", () => {
    expect(authErrorMessage({ code: "over_email_send_rate_limit" })).toContain("Bir daqiqa");
    expect(authErrorMessage({ status: 429 })).toContain("Bir daqiqa");
  });

  it("noto'g'ri kod uchun yangi kod so'rashni aytadi", () => {
    expect(authErrorMessage({ code: "otp_expired" })).toContain("yangi kod");
  });

  it("tarmoq xatosini alohida tushuntiradi", () => {
    expect(authErrorMessage({ name: "AuthRetryableFetchError" })).toContain("ulanib boʻlmadi");
  });

  it("noma'lum xatoda texnik matnni ko'rsatmaydi", () => {
    const message = authErrorMessage({ code: "something_new", message: "internal: db timeout at 10.0.0.1" });
    expect(message).not.toContain("10.0.0.1");
  });
});

describe("safeNextPath", () => {
  it("ichki sahifalarga ruxsat beradi", () => {
    expect(safeNextPath("/app/kurs")).toBe("/app/kurs");
    expect(safeNextPath("/app/dars/1?qadam=2")).toBe("/app/dars/1?qadam=2");
  });

  it("tashqi saytga yo'naltirishni bloklaydi", () => {
    for (const bad of ["https://evil.uz", "//evil.uz", "/\\evil.uz", "javascript:alert(1)", "/\u0000x", "", null, 42]) {
      expect(safeNextPath(bad)).toBe("/app");
    }
  });

  it("kirish sahifasining o'ziga qaytarmaydi", () => {
    expect(safeNextPath("/kirish?next=/app")).toBe("/app");
  });
});
