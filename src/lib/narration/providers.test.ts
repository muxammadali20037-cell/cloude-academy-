import { describe, expect, it } from "vitest";
import { sameVoiceName } from "../../../tools/narration/providers";
import { readWav, writeWav } from "../../../tools/narration/wav";
import { voiceSchema } from "./schema";

describe("VoiceLab provayderi", () => {
  it("ovoz nomi tutuq belgisi va harf katta-kichikligidan qat'i nazar topiladi", () => {
    expect(sameVoiceName("Abdulhay Otaxo'jayev", "Abdulhay Otaxoʻjayev")).toBe(true);
    expect(sameVoiceName("abdulhay otaxo‘jayev", "Abdulhay Otaxoʻjayev")).toBe(true);
    expect(sameVoiceName("Abdulhay", "Abdulhay Otaxoʻjayev")).toBe(false);
  });

  it("tijoriy ruxsat standart holatda tasdiqlanmagan, tezlik 1", () => {
    const voice = voiceSchema.parse({
      azure: { name: "uz-UZ-MadinaNeural", rate: "-5%" },
      mms: { model: "m", speakingRate: 1, seed: 1 },
      voicelab: { voice: "Abdulhay Otaxoʻjayev" },
    });
    expect(voice.voicelab).toEqual({ voice: "Abdulhay Otaxoʻjayev", speed: 1, commercialLicense: false });
  });
});

describe("WAV o'qish", () => {
  it("16-bit PCM yozib o'qiladi", () => {
    const samples = new Int16Array([0, 1000, -1000, 32767]);
    expect(Array.from(readWav(writeWav({ sampleRate: 24000, samples })).samples)).toEqual(Array.from(samples));
  });

  it("32-bit float WAV 16-bit ga o'giriladi", () => {
    const values = [0, 0.5, -0.5, 1];
    const data = Buffer.alloc(values.length * 4);
    values.forEach((value, index) => data.writeFloatLE(value, index * 4));
    const header = Buffer.alloc(44);
    header.write("RIFF", 0, "ascii");
    header.writeUInt32LE(36 + data.length, 4);
    header.write("WAVE", 8, "ascii");
    header.write("fmt ", 12, "ascii");
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(3, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(24000, 24);
    header.writeUInt32LE(24000 * 4, 28);
    header.writeUInt16LE(4, 32);
    header.writeUInt16LE(32, 34);
    header.write("data", 36, "ascii");
    header.writeUInt32LE(data.length, 40);
    const pcm = readWav(Buffer.concat([header, data]));
    expect(pcm.sampleRate).toBe(24000);
    expect(Array.from(pcm.samples)).toEqual([0, 16384, -16383, 32767]);
  });
});
