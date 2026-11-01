"""
Dars videosini yaratish (sahnalar HTML'da, render — Playwright + ffmpeg).

Ishlatish (repo ildizidan):
    python3 tools/lesson-video/render.py tools/lesson-video/scenes/l1-m1-01-claude-nima.html
    python3 tools/lesson-video/render.py <sahna.html> --preview   # faqat kadrlar (tekshirish uchun)

Natija: tools/lesson-video/out/<nom>.mp4 (gitga yuklanmaydi; video xostingga yuklanadi).

Hozircha ovozsiz. Ovoz (TTS) provayder kaliti kiritilgach, har bir sahna
uchun audio yaratilib, sahna davomiyligi audioga moslanadi va subtitr (VTT)
qo'shiladi — bu qadam GitHub Actions'da bajariladi (kalitlar GitHub secrets'da).

Har bir sahna alohida mp4 (kirish animatsiyasi kadrlari + ushlab turilgan
oxirgi kadr), hammasi bir xil o'lcham/fps/kodekda; keyin concat bilan birlashadi.
"""
import argparse
import asyncio
import os
import subprocess
import tempfile

from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT_DIR = "file://" + os.path.join(ROOT, "node_modules", "@fontsource-variable", "onest", "files")
OUT_DIR = os.path.join(ROOT, "tools", "lesson-video", "out")
FPS = 30
ANIM_SECONDS = 1.6
FADE_OUT = 0.4
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-video_track_timescale", "15360", "-movflags", "+faststart"]


async def render(scene_file: str, preview: bool) -> None:
    name = os.path.splitext(os.path.basename(scene_file))[0]
    work = os.path.join(OUT_DIR, name)
    os.makedirs(work, exist_ok=True)

    with open(scene_file, encoding="utf-8") as fh:
        html = fh.read().replace("__FONT_DIR__", FONT_DIR)
    page_path = os.path.join(work, "scenes.html")
    with open(page_path, "w", encoding="utf-8") as fh:
        fh.write(html)

    chrome = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or None
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=chrome, args=["--no-sandbox"] if chrome else [])
        page = await browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        await page.goto("file://" + page_path)
        await page.evaluate("document.fonts.ready")
        count = await page.evaluate("window.sceneCount")

        if preview:
            for i in range(count):
                await page.evaluate(f"window.showScene({i}, 5)")
                await page.screenshot(path=os.path.join(work, f"preview-{i + 1}.png"))
            print(f"{count} ta kadr: {work}")
            await browser.close()
            return

        parts = []
        for i in range(count):
            dur = await page.evaluate(f"window.sceneDur({i})")
            total, anim = int(round(dur * FPS)), int(ANIM_SECONDS * FPS)
            final = os.path.join(work, f"scene-{i + 1}.mp4")
            tmp = final.replace(".mp4", ".tmp.mp4")
            fade = 0.8 if i == count - 1 else FADE_OUT
            ff = subprocess.Popen(
                ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
                 "-vf", f"fade=out:st={dur - fade}:d={fade}", *ENC, "-t", str(dur), tmp],
                stdin=subprocess.PIPE,
            )
            for f in range(anim):
                await page.evaluate(f"window.showScene({i}, {f / FPS})")
                ff.stdin.write(await page.screenshot(type="jpeg", quality=92))
            await page.evaluate(f"window.showScene({i}, 5)")
            still = await page.screenshot(type="jpeg", quality=92)
            for _ in range(total - anim):
                ff.stdin.write(still)
            ff.stdin.close()
            if ff.wait() != 0:
                raise SystemExit(f"ffmpeg xatosi: {i + 1}-sahna")
            os.replace(tmp, final)
            parts.append(final)
            print(f"{i + 1}-sahna: {dur} s")
        await browser.close()

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as listing:
        listing.writelines(f"file '{part}'\n" for part in parts)
    target = os.path.join(OUT_DIR, f"{name}.mp4")
    tmp = target.replace(".mp4", ".tmp.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listing.name,
                    "-c", "copy", "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, target)
    os.unlink(listing.name)
    print(f"Tayyor: {target}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dars videosini yaratish")
    parser.add_argument("scene_file")
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    asyncio.run(render(os.path.abspath(args.scene_file), args.preview))
