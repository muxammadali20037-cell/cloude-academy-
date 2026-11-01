"""
Ovozni qayta matnga aylantirib tekshirish (nutqni tanish, ASR).

Maqsad: yaratilgan ovoz haqiqatan ham ssenariydagi so'zlarni aytayotganini
o'lchash. Model: islomov/rubaistt_v2_medium — o'zbek tiliga moslangan Whisper
medium (Apache-2.0). Natija faqat tekshiruv hisobotiga yoziladi.

Kirish (stdin, JSON):
  {"model": "...", "wav": "/path/16k.wav",
   "segments": [{"id": "c01", "start": 0.9, "end": 6.4}]}
Chiqish (stdout): har bir qatorda {"id": "c01", "text": "..."}
"""
import json
import sys
import wave

import numpy as np
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor

BATCH = 6


def main() -> None:
    request = json.load(sys.stdin)
    processor = WhisperProcessor.from_pretrained(request["model"])
    model = WhisperForConditionalGeneration.from_pretrained(request["model"]).eval()

    with wave.open(request["wav"], "rb") as source:
        if source.getframerate() != 16000 or source.getnchannels() != 1:
            raise SystemExit("ASR uchun 16 kHz mono WAV kerak")
        audio = np.frombuffer(source.readframes(source.getnframes()), dtype="<i2").astype(np.float32) / 32768.0

    segments = request["segments"]
    for offset in range(0, len(segments), BATCH):
        batch = segments[offset : offset + BATCH]
        clips = [audio[int(item["start"] * 16000) : int(item["end"] * 16000)] for item in batch]
        features = processor(clips, sampling_rate=16000, return_tensors="pt").input_features
        with torch.no_grad():
            ids = model.generate(features, language="uz", task="transcribe", max_new_tokens=160)
        for item, text in zip(batch, processor.batch_decode(ids, skip_special_tokens=True)):
            print(json.dumps({"id": item["id"], "text": text.strip()}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
