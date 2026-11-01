import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { timelineSchema, type Timeline } from "@/lib/narration/schema";
import raw from "../../../content/narration/l1-m1-01/timeline.json";
import { NarratedPlayer } from "./narrated-player";

const lesson: Timeline = timelineSchema.parse(raw);
const silent: Timeline = { ...lesson, audio: null };
const withAudio: Timeline = {
  ...lesson,
  audio: lesson.audio ?? {
    src: "/narration/test.mp3",
    provider: "mms",
    voice: "test",
    license: "CC-BY-NC-4.0",
    commercialUse: false,
    generatedAt: "2026-11-01T00:00:00.000Z",
    bytes: 1000,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NarratedPlayer", () => {
  it("ovoz yaratilmagan bo'lsa, subtitr bilan ishlaydi va buni ochiq aytadi", () => {
    render(<NarratedPlayer timeline={silent} />);
    expect(screen.getByRole("region", { name: "Ovozli dars: Claude nima?" })).toHaveAttribute("data-status", "silent");
    expect(screen.getByText(/ovoz hali yaratilmagan/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Darsni boshlash" })).toBeEnabled();
    // Ovoz yo'q — ovoz tugmasi ham yo'q (soxta boshqaruv ko'rsatilmaydi).
    expect(screen.queryByRole("button", { name: "Oʻqituvchi ovozi" })).not.toBeInTheDocument();
  });

  it("matndagi gapni bosish animatsiyani shu joyga o'tkazadi", async () => {
    const user = userEvent.setup();
    const { container } = render(<NarratedPlayer timeline={silent} />);
    await user.click(screen.getByText("Tushuntirish matni"));
    const target = silent.cues.find((cue) => cue.id === "c15")!;
    const item = screen.getByRole("button", { name: new RegExp(target.text.slice(0, 24)) });
    await user.click(item);
    expect(container.querySelector("[data-cue]")).toHaveAttribute("data-cue", "c15");
    expect(container.querySelector("[data-scene]")).toHaveAttribute("data-scene", "browser");
    expect(item).toHaveAttribute("aria-current", "step");
    expect(screen.getByLabelText("Dars vaqti")).toHaveValue(String(target.start));
  });

  it("subtitrni yashirish va qayta ko'rsatish mumkin", async () => {
    const user = userEvent.setup();
    render(<NarratedPlayer timeline={silent} />);
    expect(screen.getByTestId("narration-subtitle")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Subtitr" }));
    expect(screen.queryByTestId("narration-subtitle")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Subtitr" }));
    expect(screen.getByTestId("narration-subtitle")).toBeInTheDocument();
  });

  it("tezlik tanlanadi", async () => {
    const user = userEvent.setup();
    render(<NarratedPlayer timeline={silent} />);
    await user.selectOptions(screen.getByLabelText("Tezlik"), "1.5");
    expect(screen.getByLabelText("Tezlik")).toHaveValue("1.5");
  });

  it("audio yuklanmasa, ovozsiz davom etadi va qayta urinish taklif qiladi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("tarmoq yo'q")));
    render(<NarratedPlayer timeline={withAudio} />);
    expect(await screen.findByText(/Ovoz yuklanmadi/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qayta urinish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Darsni boshlash" })).toBeEnabled();
  });

  it("tijoriy bo'lmagan sinov ovozi va tekshiruvdagi matn belgilanadi", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<NarratedPlayer timeline={{ ...withAudio, audio: { ...withAudio.audio!, commercialUse: false } }} />);
    expect(screen.getByText(/Sinov ovozi/)).toBeInTheDocument();
    expect(screen.getByText("Matn admin tekshiruvida")).toBeInTheDocument();
    // Yuklanayotganda ijro tugmasi bloklanadi.
    expect(screen.getByRole("button", { name: /Ovoz yuklanmoqda/ })).toBeDisabled();
  });
});
