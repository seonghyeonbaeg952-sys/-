from __future__ import annotations

import sys
from pathlib import Path

VENDOR = Path(__file__).resolve().parent / "photo-audit-vendor"
sys.path.insert(0, str(VENDOR))

from PIL import Image, ImageDraw, ImageFont, ImageOps  # noqa: E402
import pillow_heif  # noqa: E402


pillow_heif.register_heif_opener()
Image.MAX_IMAGE_PIXELS = None

OUTPUT = Path(__file__).resolve().parent / "history-photo-audit" / "selected"
SOURCES = [
    ("2015 · 창단기록", Path(r"C:\Users\seong\OneDrive\Desktop\유스 사진 모음\제1회정기연주회.jpg")),
    ("2018 · 유럽 비전투어", Path(r"C:\Users\seong\OneDrive\Desktop\유스 사진 모음\2면.jpg")),
    ("2025 · 제11회 정기연주회 A", Path(r"C:\Users\seong\OneDrive\Desktop\2025\[연주회] 제11회 정기연주회\IMG_4447.jpg")),
    ("2025 · 제11회 정기연주회 B", Path(r"C:\Users\seong\OneDrive\Desktop\2025\[연주회] 제11회 정기연주회\IMG_4460.jpg")),
    ("2025 · 제11회 정기연주회 C", Path(r"C:\Users\seong\OneDrive\Desktop\2025\[연주회] 제11회 정기연주회\IMG_4492.jpg")),
    ("2025 · 비전투어 리허설", Path(r"C:\Users\seong\OneDrive\Desktop\2025\2025 유스비전투어 사진\1. 단체사진\1739719023028.jpg")),
    ("2025 · 비전투어 야외 합창", Path(r"C:\Users\seong\OneDrive\Desktop\2025\2025 유스비전투어 사진\5. 준식카메라\단체사진\DSC_1922.JPG")),
    ("2025 · 비전투어 공연 A", Path(r"C:\Users\seong\OneDrive\Desktop\2025\2025 유스비전투어 사진\5. 준식카메라\단체사진\DSC_2766.JPG")),
    ("2025 · 비전투어 공연 B", Path(r"C:\Users\seong\OneDrive\Desktop\2025\2025 유스비전투어 사진\5. 준식카메라\단체사진\DSC_2774.JPG")),
    ("2025 · 여름수련회", Path(r"C:\Users\seong\OneDrive\Desktop\2025\[사진] 2025 여름수련회 (천진중앙교회연주)\KakaoTalk_20250725_150148984_06.jpg")),
    ("2026 · 겨울수련회", Path(r"C:\Users\seong\OneDrive\Desktop\2026\겨울수련회\DSC_4569.JPG")),
    ("2026 · 법원 방문", Path(r"C:\Users\seong\OneDrive\Desktop\2026\법원\P20260725_123115050_85E81E67-EAFE-484A-8DE0-CD6A3DDD126C.HEIC")),
]


def font(size: int, bold: bool = False):
    names = ["malgunbd.ttf", "malgun.ttf"] if bold else ["malgun.ttf", "arial.ttf"]
    for name in names:
        candidate = Path(r"C:\Windows\Fonts") / name
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    cards: list[tuple[str, Image.Image, str]] = []

    for index, (label, source) in enumerate(SOURCES, start=1):
        if not source.exists():
            raise FileNotFoundError(source)
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
        preview = ImageOps.fit(image, (720, 450), Image.Resampling.LANCZOS)
        output_name = f"{index:02d}-{source.stem}.jpg"
        figma_image = image.copy()
        figma_image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        figma_image.save(OUTPUT / output_name, "JPEG", quality=82, optimize=True, progressive=True)
        cards.append((label, preview, output_name))

    cols = 2
    rows = (len(cards) + cols - 1) // cols
    sheet = Image.new("RGB", (1560, rows * 540 + 80), "#f2efe8")
    draw = ImageDraw.Draw(sheet)
    label_font = font(26, bold=True)
    file_font = font(17)
    for index, (label, preview, output_name) in enumerate(cards):
        col = index % cols
        row = index // cols
        x = 30 + col * 780
        y = 30 + row * 540
        sheet.paste(preview, (x, y))
        draw.rectangle((x, y, x + 720, y + 450), outline="#c8c0b6", width=1)
        draw.text((x, y + 466), label, font=label_font, fill="#15171a")
        draw.text((x, y + 502), output_name, font=file_font, fill="#776d64")
    draw.rectangle((0, rows * 540 + 16, 1560, rows * 540 + 80), fill="#15171a")
    draw.text((30, rows * 540 + 30), "SMYC HISTORY · VISUAL SHORTLIST · 12 FRAMES", font=font(22, bold=True), fill="#f2efe8")
    sheet.save(OUTPUT / "history-visual-shortlist.jpg", "JPEG", quality=88, optimize=True)


if __name__ == "__main__":
    main()
