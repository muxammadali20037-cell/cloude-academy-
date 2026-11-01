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
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { scriptSchema, timelineSchema, type AudioInfo, type NarrationScript, type Timeline } from "../../src/lib/narration/schema.ts";
import { scriptHash } from "../../src/lib/narration/script-hash.ts";
import { characterErrorRate, normalizeForComparison, spokenText } from "../../src/lib/narration/speech-text.ts";
import { latinToCyrillic } from "../../src/lib/narration/translit.ts";
import { buildTimeline, missingPurposes, timelineProblems } from "../../src/lib/narration/timeline.ts";
import { toWebVtt } from "../../src/lib/narration/vtt.ts";
import { azureProvider, MAX_INTERNAL_SILENCE, mmsAvailable, mmsProvider, type Provider } from "./providers.ts";
import { longestInternalSilence, rmsDb, writeWav, type Pcm } from "./wav.ts";

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
/** Generator mantig'i o'zgarsa oshiriladi — eski natijalar qayta yaratiladi. */
const GENERATOR_VERSION = 2;
/** Nutqni tanish orqali tekshiruv (NARRATION_ASR=1 bo'lsa, CI'da). */
const ASR_MODEL = "islomov/rubaistt_v2_medium";
const ASR_WARN_CER = 0.35;

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
  return { bytes: bytes.length, version: createHash("sha256").update(bytes).digest("hex").slice(0, 12), seconds, wavPath };
}

function qualityReport(script: NarrationScript, speech: Record<string, string>, clips: Record<string, Pcm>) {
  const problems: string[] = [];
  const warnings: string[] = [];
  const cues = script.cues.map((cue) => {
    const clip = clips[cue.id];
    const seconds = clip.samples.length / clip.sampleRate;
    const charsPerSecond = speech[cue.id].length / seconds;
    const loudness = rmsDb(clip.samples);
    const longestPause = longestInternalSilence(clip);
    if (seconds < MIN_CUE_SECONDS) problems.push(`${cue.id}: juda qisqa (${seconds.toFixed(2)} s)`);
    if (charsPerSecond < CHARS_PER_SECOND.min || charsPerSecond > CHARS_PER_SECOND.max) {
      problems.push(`${cue.id}: nutq tezligi g'ayritabiiy (${charsPerSecond.toFixed(1)} belgi/s)`);
    }
    if (loudness < MIN_RMS_DB) problems.push(`${cue.id}: audio deyarli jim (${loudness.toFixed(1)} dBFS)`);
    if (longestPause > MAX_INTERNAL_SILENCE + 0.25) warnings.push(`${cue.id}: gap ichida ${longestPause.toFixed(2)} s jimlik`);
    return {
      id: cue.id,
      speech: speech[cue.id],
      seconds: Number(seconds.toFixed(3)),
      charsPerSecond: Number(charsPerSecond.toFixed(1)),
      rmsDb: Number(loudness.toFixed(1)),
      longestPause: Number(longestPause.toFixed(2)),
    };
  });
  return { cues, problems, warnings };
}

type AsrResult = { model: string; cer: number; cues: { id: string; transcript: string; cer: number }[]; warnings: string[] };

/** Yaratilgan ovozni nutqni tanish modeli bilan qayta matnga aylantirib, ssenariy bilan solishtiradi. */
async function asrCheck(timeline: Timeline, speech: Record<string, string>, trackWav: string): Promise<AsrResult> {
  const wav16 = trackWav.replace(/\.wav$/, ".16k.wav");
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", trackWav, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav16]);
  const segments = timeline.cues.map((cue) => ({ id: cue.id, start: Math.max(0, cue.audioStart - 0.1), end: cue.audioEnd + 0.15 }));
  const output = await new Promise<string>((resolvePromise, reject) => {
    const child = spawn(process.env.NARRATION_PYTHON || "python3", [join(import.meta.dirname, "asr_check.py")], { stdio: ["pipe", "pipe", "inherit"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolvePromise(stdout) : reject(new Error(`asr_check.py xato (kod ${code})`))));
    child.stdin.end(JSON.stringify({ model: ASR_MODEL, wav: wav16, segments }));
  });
  const transcripts = new Map<string, string>();
  for (const line of output.split("\n")) {
    if (!line.trim().startsWith("{")) continue;
    const item = JSON.parse(line) as { id: string; text: string };
    transcripts.set(item.id, item.text);
  }
  let errors = 0;
  let total = 0;
  const warnings: string[] = [];
  const cues = timeline.cues.map((cue) => {
    const reference = normalizeForComparison(speech[cue.id], latinToCyrillic);
    const transcript = transcripts.get(cue.id) ?? "";
    const cer = characterErrorRate(reference, normalizeForComparison(transcript, latinToCyrillic));
    errors += cer * reference.length;
    total += reference.length;
    if (cer > ASR_WARN_CER) warnings.push(`${cue.id}: ovoz matndan farq qilishi mumkin (CER ${(cer * 100).toFixed(0)}%)`);
    return { id: cue.id, transcript, cer: Number(cer.toFixed(3)) };
  });
  return { model: ASR_MODEL, cer: Number((errors / Math.max(1, total)).toFixed(3)), cues, warnings };
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

  const previousReport = existsSync(join(CONTENT, key, "report.json")) ? await readJson(join(CONTENT, key, "report.json")) : null;
  const sameGenerator = previousReport?.generatorVersion === GENERATOR_VERSION || !provider;
  if (!force && previousMatches && sameGenerator && (previous.audio?.provider ?? null) === (provider?.id ?? null)) {
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
    let asr: AsrResult | null = null;
    if (process.env.NARRATION_ASR === "1") {
      console.log(`[${key}] nutqni tanish orqali tekshirilmoqda (${ASR_MODEL})`);
      asr = await asrCheck(timeline, speech, track.wavPath);
      console.log(`[${key}] matn bilan farq (CER): ${(asr.cer * 100).toFixed(1)}%`);
    }
    const warnings = [...quality.warnings, ...(asr?.warnings ?? [])];
    for (const warning of warnings) console.warn(`[${key}] ogohlantirish: ${warning}`);
    await writeOutputs(key, timeline, {
      key,
      generatorVersion: GENERATOR_VERSION,
      provider: provider.id,
      voice: provider.voice,
      license: provider.license,
      generatedAt: audio.generatedAt,
      durationSeconds: timeline.duration,
      mp3Seconds: track.seconds,
      warnings,
      asr: asr ? { model: asr.model, cer: asr.cer } : null,
      cues: quality.cues.map((cue) => ({ ...cue, ...(asr ? { asr: asr.cues.find((item) => item.id === cue.id) } : {}) })),
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
