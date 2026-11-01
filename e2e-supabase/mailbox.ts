/**
 * Mahalliy Supabase'ning test pochtasidan (Mailpit yoki Inbucket) kirish kodini o'qiydi.
 */
const MAILPIT_URL = process.env.MAILPIT_URL ?? process.env.INBUCKET_URL ?? "http://127.0.0.1:54324";

async function getJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  return (await response.json()) as T;
}

function extractCode(text: string): string | null {
  return text.match(/\b(\d{6})\b/)?.[1] ?? null;
}

async function tryMailpit(email: string): Promise<string | null> {
  const search = await getJson<{ messages?: { ID: string }[] }>(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
  );
  const id = search?.messages?.[0]?.ID;
  if (!id) return null;
  const message = await getJson<{ Text?: string; HTML?: string }>(`${MAILPIT_URL}/api/v1/message/${id}`);
  return extractCode(`${message?.Text ?? ""} ${message?.HTML ?? ""}`);
}

async function tryInbucket(email: string): Promise<string | null> {
  const name = email.split("@")[0];
  const list = await getJson<{ id: string }[]>(`${MAILPIT_URL}/api/v1/mailbox/${name}`);
  const id = list?.at(-1)?.id;
  if (!id) return null;
  const message = await getJson<{ body?: { text?: string; html?: string } }>(`${MAILPIT_URL}/api/v1/mailbox/${name}/${id}`);
  return extractCode(`${message?.body?.text ?? ""} ${message?.body?.html ?? ""}`);
}

/** Kod kelguncha kutadi (ko'pi bilan ~20 soniya). */
export async function waitForOtp(email: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const code = (await tryMailpit(email).catch(() => null)) ?? (await tryInbucket(email).catch(() => null));
    if (code) return code;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Kirish kodi kelmadi: ${email} (pochta: ${MAILPIT_URL})`);
}
