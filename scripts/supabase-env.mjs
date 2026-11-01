#!/usr/bin/env node
// `supabase status -o json` natijasidan ilova uchun muhit o'zgaruvchilarini
// chiqaradi (CI'da $GITHUB_ENV ga yoziladi). Faqat mahalliy test stack uchun.
import { readFileSync } from "node:fs";

const status = JSON.parse(readFileSync(0, "utf8"));
const pick = (...keys) => keys.map((key) => status[key]).find((value) => typeof value === "string" && value);

const values = {
  NEXT_PUBLIC_SUPABASE_URL: pick("API_URL", "api_url"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: pick("PUBLISHABLE_KEY", "ANON_KEY", "anon_key"),
  SUPABASE_DB_URL: pick("DB_URL", "db_url"),
  MAILPIT_URL: pick("MAILPIT_URL", "INBUCKET_URL", "inbucket_url"),
};

const missing = Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
if (missing.length > 0) {
  console.error(`supabase status'da topilmadi: ${missing.join(", ")}. Kalitlar: ${Object.keys(status).join(", ")}`);
  process.exit(1);
}
for (const [key, value] of Object.entries(values)) console.log(`${key}=${value}`);
