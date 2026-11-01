/**
 * TTS provayderlari.
 *
 *  azure — Microsoft Azure Speech, o'zbekcha neyron ovozlar (uz-UZ-MadinaNeural,
 *          uz-UZ-SardorNeural). Tijoriy foydalanishga ruxsat bor. Ishlab chiqarish uchun.
 *          Kalitlar: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (GitHub secrets).
 *  mms   — Meta MMS-TTS (facebook/mms-tts-uzb-script_cyrillic), ochiq model.
 *          Litsenziya CC-BY-NC-4.0: tijoriy foydalanish TAQIQLANGAN. Faqat tizimni
 *          sinash uchun. Pleyer bunday ovozni "sinov ovozi" deb belgilaydi.
 *
 * Har bir gap alohida sintez qilinadi va keshlanadi (.narration-cache):
 * matn o'zgarmasa, qayta yaratilmaydi.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { asciiApostrophes, speechChunks } from "../../src/lib/narration/speech-text.ts";
import { latinToCyrillic } from "../../src/lib/narration/translit.ts";
import type { NarrationScript } from "../../src/lib/narration/schema.ts";
import { concat, longestInternalSilence, readWav, silence, trimSilence, writeWav, type Pcm } from "./wav.ts";

export type ProviderId = "azure" | "mms";
export type CueSpeech = { id: string; text: string };

export type Provider = {
  id: ProviderId;
  voice: string;
  license: string;
  commercialUse: boolean;
  synthesize: (cues: CueSpeech[]) => Promise<Record<string, Pcm>>;
};

const sha = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 32);

async function cached(dir: string, key: string, make: () => Promise<Pcm>): Promise<Pcm> {
  const file = join(dir, `${sha(key)}.wav`);
  if (existsSync(file)) return readWav(await readFile(file));
  const pcm = await make();
  await mkdir(dir, { recursive: true });
  await writeFile(file, writeWav(pcm));
  return pcm;
}

/* ---------------- Azure ---------------- */

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function azureSsml(text: string, voice: string, rate: string) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="uz-UZ"><voice name="${voice}"><prosody rate="${rate}">${escapeXml(asciiApostrophes(text))}</prosody></voice></speak>`;
}

export function azureProvider(script: NarrationScript, env: NodeJS.ProcessEnv, cacheDir: string): Provider {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  if (!key || !region) throw new Error("AZURE_SPEECH_KEY va AZURE_SPEECH_REGION kiritilmagan");
  const { name, rate } = script.voice.azure;
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  async function request(ssml: string): Promise<Pcm> {
    for (let attempt = 1; ; attempt += 1) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key!,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
          "User-Agent": "claude-academy-narration",
        },
        body: ssml,
      });
      if (response.ok) return trimSilence(readWav(Buffer.from(await response.arrayBuffer())));
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= 4) {
        throw new Error(`Azure TTS xatosi: HTTP ${response.status} ${await response.text().catch(() => "")}`.trim());
      }
      await new Promise((done) => setTimeout(done, 1000 * 2 ** attempt));
    }
  }

  return {
    id: "azure",
    voice: name,
    license: "Microsoft Azure Speech (tijoriy)",
    commercialUse: true,
    async synthesize(cues) {
      const result: Record<string, Pcm> = {};
      for (const cue of cues) {
        const ssml = azureSsml(cue.text, name, rate);
        result[cue.id] = await cached(join(cacheDir, "azure"), ssml, () => request(ssml));
      }
      return result;
    },
  };
}

/* ---------------- Meta MMS (sinov) ---------------- */

type MmsJob = { id: string; text: string; seed: number; out: string };

/** Bo'lak ichidagi jimlik bundan uzun bo'lsa, bo'lak qayta yaratiladi (soniya). */
export const MAX_INTERNAL_SILENCE = 0.6;
const MMS_RETRIES = 3;

function runPython(python: string, payload: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(python, [join(import.meta.dirname, "mms_synth.py")], { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`mms_synth.py xato bilan tugadi (kod ${code})`))));
    child.stdin.end(JSON.stringify(payload));
  });
}

export function mmsProvider(script: NarrationScript, env: NodeJS.ProcessEnv, cacheDir: string): Provider {
  const { model, speakingRate, seed } = script.voice.mms;
  const python = env.NARRATION_PYTHON || "python3";
  const dir = join(cacheDir, "mms");

  return {
    id: "mms",
    voice: model,
    license: "CC-BY-NC-4.0 (faqat sinov, tijoriy emas)",
    commercialUse: false,
    async synthesize(cues) {
      await mkdir(dir, { recursive: true });
      const fileFor = (text: string, chunkSeed: number) => join(dir, `${sha(`${model}|${speakingRate}|${chunkSeed}|${text}`)}.wav`);

      // Model tinish belgilarini o'qimaydi: matn bo'laklarga bo'linadi, pauzalar shu yerda qo'yiladi.
      const plan = cues.map((cue) => ({
        id: cue.id,
        chunks: speechChunks(cue.text).map((chunk) => {
          const text = latinToCyrillic(chunk.text).replace(/[^а-яёўғқҳъь\s]/g, "").replace(/\s+/g, " ").trim();
          if (!text) throw new Error(`${cue.id}: bo'sh bo'lak`);
          return { text, pauseAfterMs: chunk.pauseAfterMs, seed, gap: Infinity };
        }),
      }));
      const allChunks = plan.flatMap((cue) => cue.chunks.map((chunk, index) => ({ chunk, id: `${cue.id}#${index}` })));

      // Model ba'zan so'z orasida g'ayritabiiy uzun to'xtaydi. Bunday bo'lak boshqa
      // tasodifiy urug' (seed) bilan qayta yaratiladi; eng silliq variant tanlanadi.
      let pending = allChunks;
      for (let attempt = 0; attempt <= MMS_RETRIES && pending.length > 0; attempt += 1) {
        const jobs: MmsJob[] = pending
          .map(({ chunk, id }) => ({ id, text: chunk.text, seed: seed + attempt, out: fileFor(chunk.text, seed + attempt) }))
          .filter((job) => !existsSync(job.out));
        if (jobs.length > 0) await runPython(python, { model, speakingRate, jobs });

        for (const { chunk } of pending) {
          const candidateSeed = seed + attempt;
          const gap = longestInternalSilence(readWav(await readFile(fileFor(chunk.text, candidateSeed))));
          if (gap < chunk.gap) {
            chunk.gap = gap;
            chunk.seed = candidateSeed;
          }
        }
        pending = pending.filter(({ chunk }) => chunk.gap > MAX_INTERNAL_SILENCE);
        if (pending.length > 0 && attempt < MMS_RETRIES) {
          console.log(`  uzun pauzali bo'laklar qayta yaratiladi: ${pending.map(({ id }) => id).join(", ")}`);
        }
      }

      const result: Record<string, Pcm> = {};
      for (const cue of plan) {
        const parts: Int16Array[] = [];
        let sampleRate = 0;
        for (const chunk of cue.chunks) {
          const pcm = trimSilence(readWav(await readFile(fileFor(chunk.text, chunk.seed))), -40, 40);
          sampleRate = pcm.sampleRate;
          parts.push(pcm.samples, silence(pcm.sampleRate, chunk.pauseAfterMs));
        }
        result[cue.id] = { sampleRate, samples: concat(parts) };
      }
      return result;
    },
  };
}

/** Python'da MMS uchun kerakli kutubxonalar bormi. */
export function mmsAvailable(env: NodeJS.ProcessEnv): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(env.NARRATION_PYTHON || "python3", ["-c", "import torch, transformers"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}
