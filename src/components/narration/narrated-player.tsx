"use client";

import {
  Captions,
  CaptionsOff,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  Speech,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PURPOSE_LABELS } from "@/lib/narration/constants";
import type { Timeline } from "@/lib/narration/schema";
import { stageStateAt } from "@/lib/narration/stage-state";
import { cueIndexAt } from "@/lib/narration/timeline";
import { cn } from "@/lib/utils";
import { NarrationStage } from "./narration-stage";
import { SPEEDS, useNarrationClock } from "./use-narration-clock";

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

const subscribeNothing = () => () => {};

const formatSpeed = (value: number) => `${String(value).replace(".", ",")}×`;

export type NarratedPlayerProps = {
  timeline: Timeline;
  className?: string;
};

/**
 * Ovozli dars pleyeri: animatsiya + o'qituvchi ovozi + subtitr.
 * Boshqaruv: ijro/pauza, joriy tushuntirishni qayta, boshidan, tezlik,
 * ovozni yoqish/o'chirish, ovoz balandligi, subtitr, to'liq ekran, matn.
 */
export function NarratedPlayer({ timeline, className }: NarratedPlayerProps) {
  const {
    attachAudio,
    status,
    loadProgress,
    time,
    playing,
    rate,
    volume,
    voiceOn,
    volumeSupported,
    hasVoice,
    play,
    pause,
    seek,
    setRate,
    setVolume,
    toggleVoice,
    retry,
  } = useNarrationClock(timeline);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const fullscreenSupported = useSyncExternalStore(
    subscribeNothing,
    () => Boolean(document.fullscreenEnabled),
    () => false,
  );
  const rootRef = useRef<HTMLElement>(null);
  const speedId = useId();

  const atStart = time === 0 && !playing;
  // Boshlashdan oldin sahna bo'sh turmasin: sarlavha ko'rinib turgan kadr ("poster").
  const displayTime = atStart ? timeline.cues[0].audioStart : time;
  const state = useMemo(() => stageStateAt(timeline, displayTime), [timeline, displayTime]);
  const cue = state.cue;
  const ended = !playing && time >= timeline.duration - 0.05;

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const togglePlay = useCallback(() => (playing ? pause() : void play()), [playing, pause, play]);

  /** Joriy tushuntirishni boshidan eshitish. */
  const replayCue = useCallback(() => {
    seek(cue.start);
    if (!playing) void play();
  }, [seek, cue.start, playing, play]);

  const jumpCue = useCallback(
    (delta: number) => {
      const index = Math.min(Math.max(cueIndexAt(timeline.cues, time) + delta, 0), timeline.cues.length - 1);
      seek(timeline.cues[index].start);
    },
    [timeline.cues, time, seek],
  );

  const restart = useCallback(() => {
    seek(0);
    void play();
  }, [seek, play]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const tag = target.tagName;
    if (tag === "SELECT" || tag === "TEXTAREA" || event.altKey || event.ctrlKey || event.metaKey) return;
    const isRange = tag === "INPUT";
    const isButton = tag === "BUTTON" || tag === "SUMMARY";
    switch (event.key) {
      case " ":
      case "k":
        if (isButton && event.key === " ") return;
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
      case "ArrowRight":
        if (isRange) return;
        event.preventDefault();
        jumpCue(event.key === "ArrowLeft" ? -1 : 1);
        break;
      case "r":
        replayCue();
        break;
      case "c":
        setCaptionsOn((on) => !on);
        break;
      case "m":
        if (hasVoice) toggleVoice();
        break;
    }
  }

  const loading = status === "loading";
  const showVoiceControls = hasVoice;

  return (
    <section
      ref={rootRef}
      aria-label={`Ovozli dars: ${timeline.title}`}
      onKeyDown={onKeyDown}
      data-status={status}
      className={cn(
        "overflow-hidden rounded-panel border border-line bg-canvas",
        fullscreen && "flex h-full flex-col justify-center rounded-none border-0",
        className,
      )}
    >
      {/* Audio — animatsiyadan alohida fayl; soat shu elementdan olinadi. */}
      <audio ref={attachAudio} preload="auto" className="hidden" data-testid="narration-audio" />

      <div className={cn("relative", fullscreen && "mx-auto w-full max-w-[calc((100dvh-11rem)*16/9)]")}>
        <NarrationStage state={state} />

        {(atStart || loading) && (
          <div className="absolute inset-0 grid place-items-center bg-canvas/75">
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <Button size="lg" onClick={() => void play()} disabled={loading} loading={loading} className="rounded-full">
                {!loading && <Play aria-hidden className="fill-current" />}
                {loading ? `Ovoz yuklanmoqda… ${Math.round(loadProgress * 100)}%` : "Darsni boshlash"}
              </Button>
              <p className="text-sm text-fg-muted">
                {formatTime(timeline.duration)} · {hasVoice || loading ? "ovoz va subtitr bilan" : "subtitr bilan"}
              </p>
            </div>
          </div>
        )}

        {ended && (
          <div className="absolute inset-0 grid place-items-center bg-canvas/80">
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <p className="font-semibold text-fg">Tushuntirish tugadi</p>
              <Button variant="outline" onClick={restart}>
                <RotateCcw aria-hidden />
                Qayta koʻrish
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Subtitr: ovoz bilan bir vaqtda chiqadi */}
      {captionsOn && (
        <div className="flex min-h-[6.25rem] flex-col items-center justify-center gap-1 border-t border-line px-4 py-3 text-center">
          <p className="text-xs font-medium text-fg-subtle">{state.subtitleVisible && !atStart ? PURPOSE_LABELS[cue.purpose] : "\u00a0"}</p>
          <p data-testid="narration-subtitle" className="max-w-[60ch] text-base leading-snug text-fg text-balance sm:text-lg">
            {state.subtitleVisible && !atStart ? cue.text : "\u00a0"}
          </p>
        </div>
      )}

      {/* Boshqaruv */}
      <div className="space-y-2 border-t border-line px-3 pt-3 pb-3 sm:px-4">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={timeline.duration}
            step={0.1}
            value={time}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Dars vaqti"
            aria-valuetext={`${formatTime(time)} / ${formatTime(timeline.duration)}`}
            className="block h-6 w-full cursor-pointer accent-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="icon"
            onClick={togglePlay}
            disabled={loading}
            aria-label={playing ? "Pauza" : "Ijro etish"}
            aria-keyshortcuts="k"
          >
            {playing ? <Pause aria-hidden className="fill-current" /> : <Play aria-hidden className="fill-current" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={replayCue} disabled={loading} aria-label="Joriy tushuntirishni qayta eshitish" aria-keyshortcuts="r" title="Joriy tushuntirishni qayta">
            <RotateCcw aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={restart} disabled={loading} aria-label="Boshidan koʻrish" title="Boshidan">
            <SkipBack aria-hidden />
          </Button>
          <p className="px-1.5 font-mono text-sm text-fg-muted tabular-nums">
            {formatTime(time)} / {formatTime(timeline.duration)}
          </p>

          <div className="ms-auto flex flex-wrap items-center gap-1.5">
            <label htmlFor={speedId} className="sr-only">
              Tezlik
            </label>
            <select
              id={speedId}
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
              className="h-11 w-[4.75rem] rounded-control border border-line-strong bg-canvas px-2.5 text-sm text-fg"
            >
              {SPEEDS.map((speed) => (
                <option key={speed} value={speed}>
                  {formatSpeed(speed)}
                </option>
              ))}
            </select>

            {showVoiceControls && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                aria-label="Oʻqituvchi ovozi"
                aria-keyshortcuts="m"
                title={voiceOn ? "Ovozni oʻchirish" : "Ovozni yoqish"}
                className={cn(!voiceOn && "text-fg-subtle")}
              >
                {voiceOn ? <Speech aria-hidden /> : <VolumeX aria-hidden />}
              </Button>
            )}

            {showVoiceControls && volumeSupported && (
              <div className="hidden items-center gap-1.5 px-1 sm:flex">
                <Volume2 aria-hidden className="size-4 text-fg-subtle" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  disabled={!voiceOn}
                  aria-label="Ovoz balandligi"
                  aria-valuetext={`${Math.round(volume * 100)}%`}
                  className="h-6 w-20 cursor-pointer accent-primary disabled:opacity-50"
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCaptionsOn((on) => !on)}
              aria-pressed={captionsOn}
              aria-label="Subtitr"
              aria-keyshortcuts="c"
              title={captionsOn ? "Subtitrni yashirish" : "Subtitrni koʻrsatish"}
            >
              {captionsOn ? <Captions aria-hidden /> : <CaptionsOff aria-hidden />}
            </Button>

            {fullscreenSupported && (
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label={fullscreen ? "Toʻliq ekrandan chiqish" : "Toʻliq ekran"}>
                {fullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
              </Button>
            )}
          </div>
        </div>

        <PlayerNotice timeline={timeline} status={status} onRetry={retry} />
      </div>

      {!fullscreen && <Transcript timeline={timeline} currentIndex={state.cueIndex} onSelect={(start) => seek(start)} />}
    </section>
  );
}

function PlayerNotice({ timeline, status, onRetry }: { timeline: Timeline; status: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-subtle" role="status">
      {status === "silent" && <span>Bu dars uchun ovoz hali yaratilmagan — subtitrlar bilan koʻrishingiz mumkin.</span>}
      {status === "failed" && (
        <>
          <span className="text-warning">Ovoz yuklanmadi — dars subtitr bilan davom etadi.</span>
          <Button variant="link" size="sm" onClick={onRetry} className="text-xs">
            Qayta urinish
          </Button>
        </>
      )}
      {timeline.audio && !timeline.audio.commercialUse && (
        <Badge variant="warning" title={timeline.audio.license}>
          Sinov ovozi · ochiq model, tijoriy emas
        </Badge>
      )}
      {timeline.audio?.commercialUse && <span>Ovoz: {timeline.audio.voice}</span>}
      {timeline.status !== "approved" && <Badge variant="outline">Matn admin tekshiruvida</Badge>}
      <span className="hidden sm:inline">Klaviatura: K — ijro/pauza, ← → — oldingi/keyingi, R — qayta, C — subtitr</span>
    </div>
  );
}

function Transcript({ timeline, currentIndex, onSelect }: { timeline: Timeline; currentIndex: number; onSelect: (start: number) => void }) {
  return (
    <details className="group border-t border-line">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-fg hover:bg-surface">Tushuntirish matni</summary>
      <ol className="max-h-72 space-y-0.5 overflow-y-auto px-2 pb-3">
        {timeline.cues.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.start)}
              aria-current={index === currentIndex ? "step" : undefined}
              className={cn(
                "flex w-full gap-3 rounded-control px-2.5 py-2 text-left text-sm text-fg-muted hover:bg-surface",
                index === currentIndex && "bg-accent-soft text-fg",
              )}
            >
              <span className="w-10 shrink-0 font-mono text-xs leading-5 text-fg-subtle tabular-nums">{formatTime(item.start)}</span>
              <span>{item.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </details>
  );
}
