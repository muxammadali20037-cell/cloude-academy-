"""
Ovozli darsni MP4 faylga yozish (ko'rib chiqish, Telegram yoki oflayn uchun).

Ilovadagi haqiqiy pleyer ochiladi, har bir kadr uchun vaqt aniq o'rnatiladi
(sahna vaqtning sof funksiyasi), kadrlar ffmpeg'ga uzatiladi va generator
yaratgan narration.mp3 aynan 0-soniyadan qo'shiladi. Subtitr kadr ichida.

Ishlatish (ilova ishlab turgan bo'lsin, masalan `npx next start -p 3200`):
    python3 tools/narration/export-mp4.py l1-m1-01 --url http://localhost:3200 --out dars.mp4
"""
import argparse
import asyncio
import json
import os
import subprocess

from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FPS = 30

SEEK = """(t) => {
  const input = document.querySelector('input[aria-label="Dars vaqti"]');
  input.step = "any";
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, String(t));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
}"""


async def export(key: str, url: str, out: str, scheme: str) -> None:
    timeline = json.load(open(os.path.join(ROOT, "content", "narration", key, "timeline.json"), encoding="utf-8"))
    if not timeline["audio"]:
        raise SystemExit("Bu dars uchun ovoz yaratilmagan")
    audio_path = os.path.join(ROOT, "public", timeline["audio"]["src"].split("?")[0].lstrip("/"))
    duration = timeline["duration"]
    frames = int(duration * FPS) - 2

    chrome = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or None
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=chrome, args=["--no-sandbox"] if chrome else [])
        page = await browser.new_page(viewport={"width": 1180, "height": 1000}, device_scale_factor=2, color_scheme=scheme)
        await page.goto(f"{url}/design-system#ovozli-dars")
        player = page.locator('section[aria-label^="Ovozli dars"]')
        await page.wait_for_function("document.querySelector('section[aria-label^=\"Ovozli dars\"]').dataset.status === 'ready'", timeout=60000)
        await player.scroll_into_view_if_needed()
        stage = player.locator("[data-cue]")
        subtitle = player.get_by_test_id("narration-subtitle").locator("..")
        await page.evaluate(SEEK, 0.001)
        a = await stage.bounding_box()
        b = await subtitle.bounding_box()
        clip = {"x": a["x"], "y": a["y"], "width": a["width"], "height": b["y"] + b["height"] - a["y"]}
        # Juft o'lcham (yuv420p talabi).
        width, height = int(clip["width"] * 2) // 2 * 2, int(clip["height"] * 2) // 2 * 2

        tmp = out + ".tmp.mp4"
        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
             "-i", audio_path, "-map", "0:v", "-map", "1:a",
             "-vf", f"scale={width}:{height}:flags=lanczos,format=yuv420p",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", str(FPS),
             "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", tmp],
            stdin=subprocess.PIPE,
        )
        for index in range(frames):
            await page.evaluate(SEEK, max(0.001, index / FPS))
            ff.stdin.write(await page.screenshot(type="jpeg", quality=90, clip=clip))
            if index % (FPS * 10) == 0:
                print(f"{index / FPS:.0f} s / {duration:.0f} s", flush=True)
        ff.stdin.close()
        if ff.wait() != 0:
            raise SystemExit("ffmpeg xatosi")
        os.replace(tmp, out)
        await browser.close()
    print(f"Tayyor: {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("key")
    parser.add_argument("--url", default="http://localhost:3200")
    parser.add_argument("--out", required=True)
    parser.add_argument("--scheme", default="light", choices=["light", "dark"])
    args = parser.parse_args()
    asyncio.run(export(args.key, args.url, os.path.abspath(args.out), args.scheme))
