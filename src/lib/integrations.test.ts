import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getIntegrationStatuses, listIntegrationEnvVars } from "./integrations";

const byId = (env: Record<string, string>) =>
  Object.fromEntries(getIntegrationStatuses(env).map((item) => [item.id, item]));

describe("getIntegrationStatuses", () => {
  it("kalitlar bo'lmasa hammasi NOT CONFIGURED", () => {
    const statuses = getIntegrationStatuses({});
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((item) => !item.configured)).toBe(true);
  });

  it("faqat yetishmayotgan o'zgaruvchi NOMLARINI qaytaradi, qiymatlarni emas", () => {
    const secret = "sk-ant-very-secret-value";
    const result = byId({ ANTHROPIC_API_KEY: secret, PAYME_MERCHANT_ID: "m-1" });
    expect(result.anthropic.configured).toBe(true);
    expect(result.payme.missing).toEqual(["PAYME_KEY"]);
    expect(JSON.stringify(getIntegrationStatuses({ ANTHROPIC_API_KEY: secret }))).not.toContain(secret);
  });

  it("bo'sh joydan iborat qiymatni kiritilmagan deb hisoblaydi", () => {
    expect(byId({ ANTHROPIC_API_KEY: "   " }).anthropic.configured).toBe(false);
  });

  it("video provayder tanlangan bo'lsa, o'sha provayder kalitlarini talab qiladi", () => {
    const partial = byId({ VIDEO_PROVIDER: "bunny", BUNNY_STREAM_LIBRARY_ID: "1" });
    expect(partial.video.provider).toBe("bunny");
    expect(partial.video.missing).toEqual(["BUNNY_STREAM_API_KEY", "BUNNY_TOKEN_AUTH_KEY"]);

    const full = byId({ VIDEO_PROVIDER: "mux", MUX_TOKEN_ID: "a", MUX_TOKEN_SECRET: "b" });
    expect(full.video.configured).toBe(true);
  });

  it("noma'lum provayder nomini xato deb ko'rsatadi", () => {
    const result = byId({ TTS_PROVIDER: "noma'lum" });
    expect(result.tts.configured).toBe(false);
    expect(result.tts.missing).toEqual(["TTS_PROVIDER"]);
  });
});

describe(".env.example", () => {
  it("integratsiyalar ishlatadigan har bir o'zgaruvchi namunada bor", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    const declared = new Set(
      example
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("=")[0]),
    );
    const missing = listIntegrationEnvVars().filter((name) => !declared.has(name));
    expect(missing).toEqual([]);
  });

  it("namunada haqiqiy qiymat yo'q", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    const filled = example
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .filter((line) => !line.startsWith("APP_URL=") && !/^[A-Z0-9_]+=(\s*#.*)?$/.test(line.trim()));
    expect(filled).toEqual([]);
  });
});
