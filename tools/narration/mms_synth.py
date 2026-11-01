"""
Meta MMS-TTS (o'zbekcha, kirill) bilan matnni ovozga aylantirish.

Faqat SINOV uchun: modelning litsenziyasi CC-BY-NC-4.0 — tijoriy foydalanish
taqiqlangan. Ishlab chiqarishda Azure provayderi ishlatiladi.

Kirish (stdin, JSON):
  {"model": "...", "speakingRate": 0.92,
   "jobs": [{"id": "c01#0", "text": "кирилл матн", "seed": 7, "out": "/path/file.wav"}]}
Natija: har bir job uchun 16-bit mono WAV fayl.
"""
import json
import sys
import wave

import numpy as np
import torch
from transformers import AutoTokenizer, VitsModel


def main() -> None:
    request = json.load(sys.stdin)
    model_id = request["model"]
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = VitsModel.from_pretrained(model_id).eval()
    model.speaking_rate = float(request["speakingRate"])
    sample_rate = model.config.sampling_rate
    torch.set_num_threads(max(1, torch.get_num_threads()))

    for job in request["jobs"]:
        inputs = tokenizer(job["text"], return_tensors="pt")
        if inputs["input_ids"].shape[-1] < 2:
            raise SystemExit(f"{job['id']}: matn tokenlarga aylanmadi: {job['text']!r}")
        # Bir xil matn har safar bir xil ovoz bersin (model tasodifiy qismga ega).
        torch.manual_seed(int(job["seed"]))
        with torch.no_grad():
            waveform = model(**inputs).waveform[0].cpu().numpy()
        pcm = (np.clip(waveform, -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(job["out"], "wb") as out:
            out.setnchannels(1)
            out.setsampwidth(2)
            out.setframerate(sample_rate)
            out.writeframes(pcm.tobytes())
        print(f"{job['id']} (seed {job['seed']}): {len(pcm) / sample_rate:.2f} s", flush=True)


if __name__ == "__main__":
    main()
