"use client";

import { ArrowUp, CornerDownLeft, MousePointer2, TriangleAlert } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BROWSER_LAYOUT, listLayout, TITLE_LAYOUT, type Rect } from "@/lib/narration/layout";
import { STAGE, type BrowserScene, type ListScene, type TitleScene } from "@/lib/narration/schema";
import type { StageState } from "@/lib/narration/stage-state";
import { cn } from "@/lib/utils";

/**
 * Sahna: mantiqiy 960×540 maydon, konteyner kengligiga qarab kichraytiriladi.
 * Hamma narsa StageState'dan chiziladi — CSS taymerlari yo'q, shuning uchun
 * har qanday vaqtda (pauza, orqaga o'tish, 1.5× tezlik) holat aniq.
 */
export function NarrationStage({ state, className }: { state: StageState; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / STAGE.width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      aria-hidden
      data-scene={state.sceneId}
      data-cue={state.cue.id}
      className={cn("relative aspect-video w-full overflow-hidden bg-canvas select-none", className)}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: STAGE.width,
          height: STAGE.height,
          transform: `scale(${scale ?? 1})`,
          visibility: scale === null ? "hidden" : "visible",
        }}
      >
        <div className="absolute inset-0" style={{ opacity: state.sceneProgress }}>
          {state.scene.type === "title" && <TitleView scene={state.scene} state={state} />}
          {state.scene.type === "list" && <ListView scene={state.scene} state={state} />}
          {state.scene.type === "browser" && <BrowserView scene={state.scene} state={state} />}
        </div>
        {state.key && <KeyCap label={state.key.label} progress={state.key.progress} nearAddress={state.scene.type === "browser"} />}
        {state.cursor.visible && <Cursor x={state.cursor.x} y={state.cursor.y} click={state.cursor.clickProgress} />}
      </div>
    </div>
  );
}

/* ---------- Yordamchilar ---------- */

function box(rect: Rect): CSSProperties {
  return { position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h };
}

/** Paydo bo'lish: pastdan biroz ko'tarilib, shaffoflikdan chiqadi. */
function rise(progress: number | undefined): CSSProperties {
  const p = progress ?? 0;
  return { opacity: p, transform: `translateY(${(1 - p) * 14}px)` };
}

function highlightStrength(state: StageState, target: string) {
  return state.highlight?.target === target ? state.highlight.strength : 0;
}

/** Ajratib ko'rsatish ramkasi — o'qituvchi "mana shu yerga qarang" deyayotgan joy. */
function Spotlight({ rect, strength, radius = 14, inset = 8 }: { rect: Rect; strength: number; radius?: number; inset?: number }) {
  if (strength <= 0) return null;
  return (
    <div
      className="pointer-events-none border-2 border-primary bg-primary/8"
      style={{
        position: "absolute",
        left: rect.x - inset,
        top: rect.y - inset,
        width: rect.w + inset * 2,
        height: rect.h + inset * 2,
        borderRadius: radius,
        opacity: strength,
        boxShadow: `0 0 0 ${6 * strength}px color-mix(in oklab, var(--primary) 14%, transparent)`,
      }}
    />
  );
}

function Caret({ visible, height }: { visible: boolean; height: number }) {
  if (!visible) return null;
  return <span className="ml-0.5 inline-block w-[2px] translate-y-[3px] bg-primary" style={{ height }} />;
}

/** Matn ichidagi muhim bo'lakni (masalan, kasb) ajratib ko'rsatadi. */
function withFocus(text: string, focus: string | undefined, strength: number): ReactNode {
  if (!focus || !text.includes(focus)) return text;
  const index = text.indexOf(focus);
  return (
    <>
      {text.slice(0, index)}
      <span
        className="rounded-[4px] text-fg"
        style={{
          backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(22 * strength)}%, transparent)`,
          boxShadow: strength > 0 ? `0 0 0 3px color-mix(in oklab, var(--primary) ${Math.round(22 * strength)}%, transparent)` : undefined,
        }}
      >
        {focus}
      </span>
      {text.slice(index + focus.length)}
    </>
  );
}

/* ---------- Sahna turlari ---------- */

function TitleView({ scene, state }: { scene: TitleScene; state: StageState }) {
  return (
    <>
      <p className="text-[18px] font-medium tracking-wide text-accent-fg" style={{ ...box(TITLE_LAYOUT.eyebrow), ...rise(state.revealed.eyebrow) }}>
        {scene.eyebrow}
      </p>
      <p className="text-[64px] leading-none font-semibold tracking-[-0.03em] text-fg" style={{ ...box(TITLE_LAYOUT.title), ...rise(state.revealed.title) }}>
        {scene.title}
      </p>
      <p className="text-[26px] leading-snug text-fg-muted" style={{ ...box(TITLE_LAYOUT.lead), ...rise(state.revealed.lead) }}>
        {scene.lead}
      </p>
      <div className="absolute bottom-[96px] left-[72px] h-[6px] w-[120px] rounded-full bg-primary" style={{ opacity: state.revealed.lead ?? 0 }} />
    </>
  );
}

function ListView({ scene, state }: { scene: ListScene; state: StageState }) {
  const layout = listLayout(scene);
  return (
    <>
      <p className="text-[36px] leading-tight font-semibold tracking-[-0.02em] text-fg" style={{ ...box(layout.heading), ...rise(state.revealed.heading) }}>
        {scene.heading}
      </p>
      {scene.items.map((item, index) => {
        const rect = layout[item.id];
        const lead = item.tone === "lead";
        return (
          <div key={item.id}>
            <Spotlight rect={rect} strength={highlightStrength(state, item.id)} />
            <div
              className={cn(
                "flex items-center gap-5 rounded-[14px] px-5",
                lead ? "bg-accent-soft text-[26px] font-semibold text-accent-fg" : "bg-surface text-[24px] font-medium text-fg",
              )}
              style={{ ...box(rect), ...rise(state.revealed[item.id]) }}
            >
              <Marker marker={scene.marker} index={index} lead={lead} />
              <span className="min-w-0 leading-snug">{item.text}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Marker({ marker, index, lead }: { marker: ListScene["marker"]; index: number; lead: boolean }) {
  if (marker === "number") {
    return (
      <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-primary text-[18px] font-semibold text-on-primary">
        {index + 1}
      </span>
    );
  }
  if (marker === "warning") return <TriangleAlert className="size-[26px] shrink-0 text-warning" strokeWidth={2.25} />;
  return <span className={cn("size-[12px] shrink-0 rounded-full", lead ? "bg-primary" : "bg-fg-subtle")} />;
}

const ANSWER_LINES = [0.92, 0.84, 0.6, 0.88, 0.76, 0.5];

function BrowserView({ scene, state }: { scene: BrowserScene; state: StageState }) {
  const L = BROWSER_LAYOUT;
  const page = state.revealed.page ?? 0;
  const address = state.typed.address ?? "";
  const input = state.typed.input ?? "";
  const focusStrength = highlightStrength(state, "focus");
  const streamed = state.streamed.answer ?? 0;
  const message = state.sent[state.sent.length - 1];

  return (
    <>
      {/* Oyna */}
      <div className="rounded-[16px] border border-line bg-canvas" style={box(L.frame)} />
      <div className="flex items-center gap-[7px] rounded-t-[16px] border-b border-line bg-surface px-4" style={box(L.toolbar)}>
        <span className="size-[11px] rounded-full bg-line-strong/60" />
        <span className="size-[11px] rounded-full bg-line-strong/60" />
        <span className="size-[11px] rounded-full bg-line-strong/60" />
      </div>
      <Spotlight rect={L.address} strength={highlightStrength(state, "address")} radius={20} inset={5} />
      <div className="flex items-center rounded-full bg-canvas px-4 text-[17px] text-fg ring-1 ring-line" style={box(L.address)}>
        <span className="truncate">{address}</span>
        <Caret visible={state.typingTarget === "address"} height={18} />
      </div>

      {/* Sahifa */}
      <div style={{ opacity: page }}>
        <Spotlight rect={L.notice} strength={highlightStrength(state, "notice")} radius={22} inset={5} />
        <div
          className="flex items-center justify-center rounded-full bg-accent-soft text-[17px] font-medium text-accent-fg"
          style={{ ...box(L.notice), ...rise(state.revealed.notice) }}
        >
          {scene.notice}
        </div>

        {message && (
          <div className="rounded-[14px] bg-surface-2 px-4 py-2.5 text-[17px] leading-[1.4] text-fg" style={box(L.message)}>
            {withFocus(message, scene.focus, focusStrength)}
          </div>
        )}

        <Spotlight rect={L.answer} strength={highlightStrength(state, "answer")} />
        {streamed > 0 && (
          <div style={box(L.answer)}>
            <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-[15px] font-medium text-accent-fg">{scene.answerLabel}</span>
            <div className="mt-3 space-y-[12px]">
              {ANSWER_LINES.map((width, index) => {
                const lineProgress = Math.min(1, Math.max(0, streamed * ANSWER_LINES.length - index));
                return (
                  <div
                    key={index}
                    className="h-[12px] rounded-full bg-fg-subtle/30"
                    style={{ width: `${width * 100 * lineProgress}%`, opacity: lineProgress > 0 ? 1 : 0 }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <Spotlight rect={L.input} strength={highlightStrength(state, "input")} radius={20} inset={6} />
        <div className="flex items-center rounded-[16px] border border-line-strong bg-canvas px-4 text-[17px] leading-[1.35] text-fg" style={box(L.input)}>
          <span className="line-clamp-2 min-w-0">{withFocus(input, scene.focus, focusStrength)}</span>
          <Caret visible={state.typingTarget === "input"} height={19} />
        </div>

        <Spotlight rect={L.send} strength={highlightStrength(state, "send")} radius={999} inset={6} />
        <div className="grid place-items-center rounded-full bg-primary text-on-primary" style={box(L.send)}>
          <ArrowUp className="size-[22px]" strokeWidth={2.5} />
        </div>
      </div>

      <p className="absolute right-[56px] bottom-[34px] text-[14px] text-fg-subtle">Sxematik koʻrinish</p>
    </>
  );
}

/* ---------- Kursor va klaviatura ---------- */

function Cursor({ x, y, click }: { x: number; y: number; click: number | null }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }}>
      {click !== null && (
        <span
          className="absolute rounded-full border-2 border-primary"
          style={{
            left: -22 * (0.4 + click),
            top: -22 * (0.4 + click),
            width: 44 * (0.4 + click),
            height: 44 * (0.4 + click),
            opacity: 1 - click,
          }}
        />
      )}
      <MousePointer2
        className="absolute -top-[3px] -left-[3px] size-[30px] fill-fg text-canvas"
        strokeWidth={1.5}
        style={{ transform: click !== null && click < 0.35 ? "scale(0.88)" : undefined, transformOrigin: "3px 3px" }}
      />
    </div>
  );
}

function KeyCap({ label, progress, nearAddress }: { label: string; progress: number; nearAddress: boolean }) {
  const opacity = progress < 0.75 ? 1 : 1 - (progress - 0.75) / 0.25;
  const pressed = progress > 0.1 && progress < 0.35;
  const address = BROWSER_LAYOUT.address;
  return (
    <div
      className={cn("absolute", !nearAddress && "bottom-[40px] left-1/2 -translate-x-1/2")}
      style={{ opacity, ...(nearAddress ? { left: address.x + address.w + 24, top: address.y - 6 } : {}) }}
    >
      <div
        className="flex items-center gap-2 rounded-[12px] border border-line-strong bg-surface px-5 py-2.5 text-[20px] font-semibold text-fg"
        style={{ boxShadow: pressed ? "none" : "0 4px 0 var(--line-strong)", transform: pressed ? "translateY(4px)" : undefined }}
      >
        {label}
        {label === "Enter" && <CornerDownLeft className="size-[20px]" />}
      </div>
    </div>
  );
}
