"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "./theme-script";

export type ThemePreference = "light" | "dark" | "system";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Yorugʻ tema", Icon: Sun },
  { value: "dark", label: "Qorongʻi tema", Icon: Moon },
  { value: "system", label: "Qurilma temasi", Icon: Monitor },
];

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // localStorage yopiq bo'lishi mumkin (maxfiy rejim) — standart qiymat.
  }
  return "system";
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tema tanlovi: yorug', qorong'i yoki qurilma sozlamasi. */
export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  const select = useCallback((value: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Saqlab bo'lmasa ham, joriy sahifada tema almashadi.
    }
    applyTheme(value);
    listeners.forEach((listener) => listener());
  }, []);

  // "Qurilma temasi" tanlanganda tizim sozlamasi o'zgarsa, darhol moslashamiz.
  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-control border border-line bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => select(value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-[0.5rem] text-fg-subtle transition-colors",
              "hover:text-fg",
              active && "bg-canvas text-fg ring-1 ring-line",
            )}
          >
            <Icon aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
