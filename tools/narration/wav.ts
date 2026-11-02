/**
 * Oddiy PCM WAV (16-bit, mono) bilan ishlash: o'qish, yozish, sukunat qo'shish,
 * boshidagi/oxiridagi sukunatni kesish, ovoz balandligini o'lchash.
 */

export type Pcm = { sampleRate: number; samples: Int16Array };

export function readWav(buffer: Buffer): Pcm {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("WAV fayl emas");
  }
  let offset = 12;
  let format: { code: number; channels: number; sampleRate: number; bits: number } | null = null;
  let data: Buffer | null = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      format = {
        code: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        bits: buffer.readUInt16LE(body + 14),
      };
    } else if (id === "data") {
      // Ba'zi servislar oqim (stream) rejimida hajmni 0 yoki maksimal qiymat qilib yozadi.
      const end = size === 0 || body + size > buffer.length ? buffer.length : body + size;
      data = buffer.subarray(body, end);
      break;
    }
    offset = body + size + (size % 2);
  }

  if (!format || !data) throw new Error("WAV: fmt yoki data bo'limi topilmadi");
  if (format.channels !== 1) throw new Error(`WAV: faqat mono qo'llanadi (kanal=${format.channels})`);
  // 32-bit float (ba'zi servislar shunday qaytaradi) → 16-bit PCM.
  if (format.bits === 32 && (format.code === 3 || format.code === 0xfffe)) {
    const count = Math.floor(data.length / 4);
    const samples = new Int16Array(count);
    for (let i = 0; i < count; i += 1) {
      samples[i] = Math.max(-32768, Math.min(32767, Math.round(data.readFloatLE(i * 4) * 32767)));
    }
    return { sampleRate: format.sampleRate, samples };
  }
  if ((format.code !== 1 && format.code !== 0xfffe) || format.bits !== 16) {
    throw new Error(`WAV: faqat 16-bit PCM yoki 32-bit float qo'llanadi (format=${format.code}, bits=${format.bits})`);
  }
  const usable = data.length - (data.length % 2);
  const copy = new ArrayBuffer(usable);
  new Uint8Array(copy).set(data.subarray(0, usable));
  return { sampleRate: format.sampleRate, samples: new Int16Array(copy) };
}

export function writeWav({ sampleRate, samples }: Pcm): Buffer {
  const header = Buffer.alloc(44);
  const dataBytes = samples.length * 2;
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.from(samples.buffer, samples.byteOffset, dataBytes)]);
}

export function silence(sampleRate: number, ms: number) {
  return new Int16Array(Math.round((sampleRate * ms) / 1000));
}

export function concat(parts: Int16Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Int16Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const dbOf = (value: number) => (value <= 0 ? -Infinity : 20 * Math.log10(value / 32768));

/** O'rtacha kvadratik balandlik, dBFS. Juda past bo'lsa — audio deyarli jim. */
export function rmsDb(samples: Int16Array) {
  if (samples.length === 0) return -Infinity;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return dbOf(Math.sqrt(sum / samples.length));
}

/**
 * Nutq ichidagi eng uzun jimlik (soniya). Tinish belgisidagi pauza 0,2–0,45 s;
 * undan ancha uzun jimlik — model "qotib qolgani" belgisi.
 */
export function longestInternalSilence({ sampleRate, samples }: Pcm, thresholdDb = -45) {
  const threshold = 32768 * Math.pow(10, thresholdDb / 20);
  const windowSize = Math.max(1, Math.round(sampleRate * 0.02));
  const loud: boolean[] = [];
  for (let start = 0; start < samples.length; start += windowSize) {
    let sum = 0;
    const end = Math.min(samples.length, start + windowSize);
    for (let i = start; i < end; i += 1) sum += samples[i] * samples[i];
    loud.push(Math.sqrt(sum / (end - start)) >= threshold);
  }
  const first = loud.indexOf(true);
  const last = loud.lastIndexOf(true);
  let longest = 0;
  let run = 0;
  for (let i = first; i <= last && first >= 0; i += 1) {
    run = loud[i] ? 0 : run + 1;
    longest = Math.max(longest, run);
  }
  return (longest * windowSize) / sampleRate;
}

/**
 * Boshidagi va oxiridagi sukunatni kesadi (provayderlar qo'shadigan bo'sh joy),
 * nafas uzilmasligi uchun chetlarda `keepMs` qoldiriladi.
 */
export function trimSilence({ sampleRate, samples }: Pcm, thresholdDb = -42, keepMs = 60): Pcm {
  const threshold = 32768 * Math.pow(10, thresholdDb / 20);
  const windowSize = Math.max(1, Math.round(sampleRate * 0.01));
  const loud = (start: number) => {
    let peak = 0;
    for (let i = start; i < Math.min(samples.length, start + windowSize); i += 1) peak = Math.max(peak, Math.abs(samples[i]));
    return peak >= threshold;
  };
  let first = 0;
  while (first < samples.length && !loud(first)) first += windowSize;
  let last = samples.length - windowSize;
  while (last > first && !loud(last)) last -= windowSize;
  if (first >= samples.length) return { sampleRate, samples: new Int16Array(0) };
  const keep = Math.round((sampleRate * keepMs) / 1000);
  return { sampleRate, samples: samples.slice(Math.max(0, first - keep), Math.min(samples.length, last + windowSize + keep)) };
}
