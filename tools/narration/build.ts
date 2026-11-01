/**
 * Ovozli dars generatori.
 *
 *   node tools/narration/build.ts l1-m1-01            # bitta dars
 *   node tools/narration/build.ts --all               # hamma darslar
 *   node tools/narration/build.ts --all --provider mms # provayderni majburlash
 *   ... --force                                       # o'zgarmagan bo'lsa ham qayta yaratish
 *
 * Provayder (--provider auto, standart):
 *   azure — AZURE_SPEECH_KEY va AZURE_SPEECH_REGION bo'lsa (ishlab chiqarish ovozi);
 *   mms   — aks holda, Python'da torch+transformers bo'lsa (faqat sinov ovozi);
 *   none  — ovoz yaratilmaydi: subtitrli, ovozsiz zaxira vaqt shkalasi.
 *
 * Natija:
 *   content/narration/<key>/timeline.json  — vaqtlar (ilova shu faylni import qiladi)
 *   content/narration/<key>/report.json    — har bir gap bo'yicha sifat ko'rsatkichlari
 *   public/narration/<key>/narration.mp3   — ovoz (animatsiya kodidan alohida)
 *   public/narration/<key>/subtitles.vtt   — subtitr
 *
 * Ovoz yaratish muvaffaqiyatsiz bo'lsa: eski (shu ssenariyga mos) ovoz saqlanadi,
 * mos ovoz bo'lmasa — ovozsiz zaxira vaqt shkalasi yoziladi va dastur 1 kod bilan tugaydi.
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { scriptSchema, timelineSchema, type AudioInfo, type NarrationScript, type Timeline } from "../../src/lib/narration/schema.ts";
import { scriptHash } from "../../src/lib/narration/script-hash.ts";
import { spokenText } from "../../src/lib/narration/speech-text.ts";
import { buildTimeline, missingPurposes, timelineProblems } from "../../src/lib/narration/timeline.ts";
import { toWebVtt } from "../../src/lib/narration/vtt.ts";
import { azureProvider, mmsAvailable, mmsProvider, type Provider } from "./providers.ts";
import { rmsDb, writeWav, type Pcm } from "./wav.ts";

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..", "..");
const CONTENT = join(ROOT, "content", "narration");
const PUBLIC = join(ROOT, "public", "narration");
const CACHE = join(ROOT, ".narration-cache");

type ProviderChoice = "auto" | "azure" | "mms" | "none";

/* ---- Sifat chegaralari: bundan tashqari bo'lsa, audio buzilgan deb hisoblanadi ---- */
const MIN_CUE_SECONDS = 0.5;
const CHARS_PER_SECOND = { min: 6, max: 26 };
const MIN_RMS_DB = -38;

function parseArgs(argv: string[]) {
  const args = { keys: [] as string[], all: false, provider: "auto" as ProviderChoice, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--all") args.all = true;
    else if (value === "--force") args.force = true;
    else if (value === "--provider") args.provider = argv[++i] as ProviderChoice;
    else args.keys.push(value);
  }
  if (!["auto", "azure", "mms", "none"].includes(args.provider)) throw new Error(`noma'lum provayder: ${args.provider}`);
  return args;
}

async function chooseProvider(choice: ProviderChoice, script: NarrationScript): Promise<Provider | null> {
  const env = process.env;
  if (choice === "none") return null;
  if (choice === "azure") return azureProvider(script, env, CACHE);
  if (choice === "mms") return mmsProvider(script, env, CACHE);
  if (env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION) return azureProvider(script, env, CACHE);
  if (await mmsAvailable(env)) return mmsProvider(script, env, CACHE);
  return null;
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function existingTimeline(key: string): Promise<Timeline | null> {
  const path = join(CONTENT, key, "timeline.json");
  if (!existsSync(path)) return null;
  const parsed = timelineSchema.safeParse(await readJson(path));
  return parsed.success ? parsed.data : null;
}

function audioFileFor(timeline: Timeline) {
  return timeline.audio ? join(ROOT, "public", timeline.audio.src.split("?")[0]) : null;
}

async function writeOutputs(key: string, timeline: Timeline, report: unknown) {
  const problems = timelineProblems(timeline);
  if (problems.length > 0) throw new Error(`vaqt shkalasi qoidalari buzilgan:\n  ${problems.join("\n  ")}`);
  timelineSchema.parse(timeline);
  await mkdir(join(PUBLIC, key), { recursive: true });
  await writeFile(join(PUBLIC, key, "subtitles.vtt"), toWebVtt(timeline));
  await writeFile(join(CONTENT, key, "timeline.json"), `${JSON.stringify(timeline, null, 2)}\n`);
  await writeFile(join(CONTENT, key, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
}

async function probeSeconds(file: string) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(stdout.trim());
}

/** Gaplarni vaqt shkalasidagi joyiga qo'yib, bitta audio yo'lak yasaydi va MP3 ga o'giradi. */
async function assembleTrack(key: string, timeline: Timeline, clips: Record<string, Pcm>) {
  const sampleRate = Object.values(clips)[0].sampleRate;
  const track = new Int16Array(Math.ceil(timeline.duration * sampleRate));
  for (const cue of timeline.cues) {
    const clip = clips[cue.id];
    if (clip.sampleRate !== sampleRate) throw new Error("gaplar turli chastotada");
    track.set(clip.samples.subarray(0, track.length - Math.round(cue.audioStart * sampleRate)), Math.round(cue.audioStart * sampleRate));
  }

  const workDir = join(CACHE, "build", key);
  await mkdir(workDir, { recursive: true });
  const wavPath = join(workDir, "track.wav");
  const mp3Path = join(workDir, "narration.mp3");
  await writeFile(wavPath, writeWav({ sampleRate, samples: track }));
  // Ovoz balandligi standartga keltiriladi (-16 LUFS, nutq uchun odatiy).
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", wavPath, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "24000", "-ac", "1",
    "-c:a", "libmp3lame", "-b:a", "64k", mp3Path]);

  const seconds = await probeSeconds(mp3Path);
  if (Math.abs(seconds - timeline.duration) > 0.2) {
    throw new Error(`MP3 uzunligi (${seconds.toFixed(2)} s) vaqt shkalasiga (${timeline.duration} s) mos emas`);
  }
  const bytes = await readFile(mp3Path);
  await mkdir(join(PUBLIC, key), { recursive: true });
  await writeFile(join(PUBLIC, key, "narration.mp3"), bytes);
  return { bytes: bytes.length, version: createHash("sha256").update(bytes).digest("hex").slice(0, 12), seconds };
}

function qualityReport(script: NarrationScript, speech: Record<string, string>, clips: Record<string, Pcm>) {
  const problems: string[] = [];
  const cues = script.cues.map((cue) => {
    const clip = clips[cue.id];
    const seconds = clip.samples.length / clip.sampleRate;
    const charsPerSecond = speech[cue.id].length / seconds;
    const loudness = rmsDb(clip.samples);
    if (seconds < MIN_CUE_SECONDS) problems.push(`${cue.id}: juda qisqa (${seconds.toFixed(2)} s)`);
    if (charsPerSecond < CHARS_PER_SECOND.min || charsPerSecond > CHARS_PER_SECOND.max) {
      problems.push(`${cue.id}: nutq tezligi g'ayritabiiy (${charsPerSecond.toFixed(1)} belgi/s)`);
    }
    if (loudness < MIN_RMS_DB) problems.push(`${cue.id}: audio deyarli jim (${loudness.toFixed(1)} dBFS)`);
    return {
      id: cue.id,
      speech: speech[cue.id],
      seconds: Number(seconds.toFixed(3)),
      charsPerSecond: Number(charsPerSecond.toFixed(1)),
      rmsDb: Number(loudness.toFixed(1)),
    };
  });
  return { cues, problems };
}

async function buildOne(key: string, choice: ProviderChoice, force: boolean): Promise<boolean> {
  const scriptPath = join(CONTENT, key, "script.json");
  const script = scriptSchema.parse(await readJson(scriptPath));
  const hash = scriptHash(script);
  const previous = await existingTimeline(key);
  const provider = await chooseProvider(choice, script);
  const previousAudio = previous ? audioFileFor(previous) : null;
  const previousMatches = previous !== null && previous.scriptHash === hash && (!previousAudio || existsSync(previousAudio));

  const purposes = missingPurposes({ cues: script.cues });
  if (purposes.length > 0) console.warn(`[${key}] ogohlantirish: darsda yo'q qism(lar): ${purposes.join(", ")}`);

  if (!force && previousMatches && (previous.audio?.provider ?? null) === (provider?.id ?? null)) {
    console.log(`[${key}] o'zgarmagan (${provider?.id ?? "ovozsiz"}) — o'tkazib yuborildi`);
    return true;
  }

  const fallback = async (reason: string) => {
    const timeline = buildTimeline({ script, scriptHash: hash, speechSeconds: null, audio: null, subtitles: `/narration/${key}/subtitles.vtt` });
    await rm(join(PUBLIC, key, "narration.mp3"), { force: true });
    await writeOutputs(key, timeline, { key, provider: null, reason, generatedAt: new Date().toISOString() });
    console.log(`[${key}] ovozsiz zaxira vaqt shkalasi yozildi: ${timeline.duration.toFixed(1)} s (${reason})`);
  };

  if (!provider) {
    // Bu kompyuterda TTS yo'q, lekin shu ssenariy uchun ovoz allaqachon yaratilgan — tegmaymiz.
    if (previousMatches && choice !== "none") {
      console.log(`[${key}] TTS provayder yo'q — mos mavjud natija saqlandi`);
      return true;
    }
    await fallback("TTS provayder mavjud emas");
    return true;
  }

  try {
    console.log(`[${key}] ovoz yaratilmoqda: ${provider.id} (${provider.voice})`);
    const speech = Object.fromEntries(script.cues.map((cue) => [cue.id, spokenText(cue.speech ?? cue.text, script.lexicon)]));
    const clips = await provider.synthesize(script.cues.map((cue) => ({ id: cue.id, text: speech[cue.id] })));
    const quality = qualityReport(script, speech, clips);
    if (quality.problems.length > 0) throw new Error(`audio sifati tekshiruvdan o'tmadi:\n  ${quality.problems.join("\n  ")}`);

    const speechSeconds = Object.fromEntries(Object.entries(clips).map(([id, clip]) => [id, clip.samples.length / clip.sampleRate]));
    const draft = buildTimeline({ script, scriptHash: hash, speechSeconds, audio: null, subtitles: null });
    const track = await assembleTrack(key, draft, clips);
    const audio: AudioInfo = {
      src: `/narration/${key}/narration.mp3?v=${track.version}`,
      provider: provider.id,
      voice: provider.voice,
      license: provider.license,
      commercialUse: provider.commercialUse,
      generatedAt: new Date().toISOString(),
      bytes: track.bytes,
    };
    const timeline: Timeline = { ...draft, audio, subtitles: `/narration/${key}/subtitles.vtt?v=${track.version}` };
    await writeOutputs(key, timeline, {
      key,
      provider: provider.id,
      voice: provider.voice,
      license: provider.license,
      generatedAt: audio.generatedAt,
      durationSeconds: timeline.duration,
      mp3Seconds: track.seconds,
      cues: quality.cues,
    });
    console.log(`[${key}] tayyor: ${timeline.duration.toFixed(1)} s, ${(track.bytes / 1024).toFixed(0)} KB, ${provider.id}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${key}] OVOZ YARATILMADI: ${message}`);
    if (previousMatches) {
      console.error(`[${key}] shu ssenariyga mos oldingi natija saqlab qolindi`);
    } else {
      await fallback(`ovoz yaratishda xato: ${message.split("\n")[0]}`);
    }
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const keys = args.all
    ? (await readdir(CONTENT, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
    : args.keys;
  if (keys.length === 0) throw new Error("dars kaliti yoki --all kerak");

  let ok = true;
  for (const key of keys) ok = (await buildOne(key, args.provider, args.force)) && ok;
  if (!ok) process.exitCode = 1;
}

await main();
