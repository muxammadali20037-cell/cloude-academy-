"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Timeline } from "@/lib/narration/schema";

/**
 * Dars soati: animatsiya qaysi soniyani ko'rsatishini belgilaydi.
 *
 *  - Ovoz bor bo'lsa, soat — audio elementining o'zi (audio.currentTime).
 *    Animatsiya har kadrda shu vaqtni o'qiydi, shuning uchun ovoz va harakat
 *    hech qachon ajralib ketmaydi: tezlik o'zgarsa ham, orqaga o'tilsa ham.
 *  - Ovoz yaratilmagan yoki yuklanmagan bo'lsa — zaxira taymer: dars subtitr
 *    bilan, ovozsiz, xuddi shu vaqtlarda davom etadi.
 *
 * Audio ijrodan oldin to'liq yuklab olinadi (blob), shuning uchun dars
 * o'rtasida internet sekinlashsa ham ovoz uzilmaydi.
 */

export type ClockStatus =
  /** Audio yuklanmoqda. */
  | "loading"
  /** Audio tayyor — soat audio bo'yicha. */
  | "ready"
  /** Ovoz yaratilmagan — subtitrli ovozsiz rejim. */
  | "silent"
  /** Audio yuklanmadi yoki ijro etilmadi — ovozsiz rejimda davom etadi. */
  | "failed";

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

let volumeSupportCache: boolean | null = null;
/** iOS'da ovoz balandligini dasturdan o'zgartirib bo'lmaydi — u holda slayder ko'rsatilmaydi. */
function detectVolumeSupport() {
  if (volumeSupportCache === null) {
    const probe = document.createElement("audio");
    probe.volume = 0.5;
    volumeSupportCache = probe.volume === 0.5;
  }
  return volumeSupportCache;
}
const subscribeNothing = () => () => {};

export function useNarrationClock(timeline: Timeline) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const frameRef = useRef<number | null>(null);
  /** Zaxira taymer: qaysi vaqtdan, qachon boshlangan. */
  const timerRef = useRef({ base: 0, startedAt: 0 });
  const timeRef = useRef(0);

  const [status, setStatus] = useState<ClockStatus>(timeline.audio ? "loading" : "silent");
  const [loadProgress, setLoadProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [voiceOn, setVoiceOn] = useState(true);
  const volumeSupported = useSyncExternalStore(subscribeNothing, detectVolumeSupport, () => true);
  const [attempt, setAttempt] = useState(0);

  const duration = timeline.duration;
  const usesAudio = status === "ready";

  const commitTime = useCallback((value: number) => {
    timeRef.current = value;
    setTime(value);
  }, []);

  /** Audio element shu callback orqali ulanadi (ref obyektini tashqariga bermaymiz). */
  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    audioRef.current = element;
  }, []);

  // Audio'ni oldindan to'liq yuklash.
  useEffect(() => {
    const audio = audioRef.current;
    const source = timeline.audio;
    if (!audio || !source) return;
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(source.src, { signal: controller.signal });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value as Uint8Array<ArrayBuffer>);
          received += value.length;
          setLoadProgress(Math.min(0.99, received / source.bytes));
        }
        const url = URL.createObjectURL(new Blob(chunks, { type: "audio/mpeg" }));
        objectUrlRef.current = url;
        audio.src = url;
        await new Promise<void>((resolve, reject) => {
          const done = () => {
            audio.removeEventListener("error", fail);
            resolve();
          };
          const fail = () => {
            audio.removeEventListener("loadedmetadata", done);
            reject(new Error("audio ochilmadi"));
          };
          audio.addEventListener("loadedmetadata", done, { once: true });
          audio.addEventListener("error", fail, { once: true });
          audio.load();
        });
        if (controller.signal.aborted) return;
        audio.currentTime = timeRef.current;
        setLoadProgress(1);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("failed");
      }
    })();

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [timeline.audio, attempt]);

  const currentTime = useCallback(() => {
    if (usesAudio && audioRef.current) return audioRef.current.currentTime;
    const { base, startedAt } = timerRef.current;
    return base + ((performance.now() - startedAt) / 1000) * rate;
  }, [usesAudio, rate]);

  // Har kadrda vaqtni o'qish.
  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const t = Math.min(currentTime(), duration);
      commitTime(t);
      if (t >= duration - 0.01 || (usesAudio && audioRef.current?.ended)) {
        audioRef.current?.pause();
        commitTime(duration);
        setPlaying(false);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, currentTime, duration, usesAudio, commitTime]);

  const startTimer = useCallback((from: number) => {
    timerRef.current = { base: from, startedAt: performance.now() };
  }, []);

  const play = useCallback(async () => {
    if (status === "loading") return;
    let from = timeRef.current;
    if (from >= duration - 0.05) {
      from = 0;
      commitTime(0);
    }
    const audio = audioRef.current;
    if (usesAudio && audio) {
      audio.currentTime = from;
      audio.playbackRate = rate;
      audio.muted = !voiceOn;
      try {
        await audio.play();
      } catch {
        // Brauzer ovozni ijro etmadi — dars subtitr bilan davom etadi.
        setStatus("failed");
        startTimer(from);
      }
    } else {
      startTimer(from);
    }
    setPlaying(true);
  }, [status, duration, usesAudio, rate, voiceOn, startTimer, commitTime]);

  const pause = useCallback(() => {
    const t = Math.min(currentTime(), duration);
    audioRef.current?.pause();
    commitTime(t);
    setPlaying(false);
  }, [currentTime, duration, commitTime]);

  const seek = useCallback(
    (value: number) => {
      const t = Math.min(Math.max(value, 0), duration);
      if (usesAudio && audioRef.current) audioRef.current.currentTime = t;
      startTimer(t);
      commitTime(t);
    },
    [duration, usesAudio, startTimer, commitTime],
  );

  const setRate = useCallback(
    (value: number) => {
      // Zaxira taymerda tezlik o'zgarganda joriy nuqtadan qayta hisoblanadi.
      if (!usesAudio) startTimer(Math.min(currentTime(), duration));
      if (audioRef.current) {
        audioRef.current.playbackRate = value;
        audioRef.current.preservesPitch = true;
      }
      setRateState(value);
    },
    [usesAudio, currentTime, duration, startTimer],
  );

  const setVolume = useCallback((value: number) => {
    if (audioRef.current) audioRef.current.volume = value;
    setVolumeState(value);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceOn((on) => {
      if (audioRef.current) audioRef.current.muted = on;
      return !on;
    });
  }, []);

  const retry = useCallback(() => {
    const t = Math.min(currentTime(), duration);
    audioRef.current?.pause();
    commitTime(t);
    setPlaying(false);
    setStatus("loading");
    setLoadProgress(0);
    setAttempt((value) => value + 1);
  }, [currentTime, duration, commitTime]);

  return {
    attachAudio,
    status,
    loadProgress,
    time,
    duration,
    playing,
    rate,
    volume,
    voiceOn,
    volumeSupported,
    hasVoice: usesAudio,
    play,
    pause,
    seek,
    setRate,
    setVolume,
    toggleVoice,
    retry,
  };
}
