from __future__ import annotations

import csv
import json
import os
import sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

VENDOR = Path(__file__).resolve().parent / "photo-audit-vendor"
sys.path.insert(0, str(VENDOR))

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat  # noqa: E402
import pillow_heif  # noqa: E402


pillow_heif.register_heif_opener()
Image.MAX_IMAGE_PIXELS = None

ROOTS = [
    Path(r"C:\Users\seong\OneDrive\Desktop\2025"),
    Path(r"C:\Users\seong\OneDrive\Desktop\2026"),
]
OUTPUT_ROOT = Path(__file__).resolve().parent / "history-photo-audit"
SHEETS_DIR = OUTPUT_ROOT / "contact-sheets"
PREVIEWS_DIR = OUTPUT_ROOT / "previews"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".heic"}
EXCLUDED_PARTS = {"output", "__macosx"}

SHEET_WIDTH = 1920
SHEET_HEIGHT = 1200
COLS = 12
ROWS = 8
CELL_WIDTH = SHEET_WIDTH // COLS
CELL_HEIGHT = SHEET_HEIGHT // ROWS
IMAGE_HEIGHT = 112
PER_SHEET = COLS * ROWS


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    names = ["malgunbd.ttf", "malgun.ttf"] if bold else ["malgun.ttf", "arial.ttf"]
    for name in names:
        path = Path(r"C:\Windows\Fonts") / name
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


FONT_LABEL = load_font(12)
FONT_GROUP = load_font(22, bold=True)
FONT_META = load_font(14)


def event_group(path: Path) -> str:
    root = next(root for root in ROOTS if path.is_relative_to(root))
    relative = path.relative_to(root)
    parts = relative.parts[:-1]
    if not parts:
        return root.name
    if root.name == "2025" and parts[0] == "2025 유스비전투어 사진" and len(parts) > 1:
        if parts[1] == "5. 준식카메라" and len(parts) > 2:
            return f"2025 / 유스비전투어 / 준식카메라 / {parts[2]}"
        return f"2025 / 유스비전투어 / {parts[1]}"
    return f"{root.name} / {parts[0]}"


def relative_label(path: Path) -> str:
    root = next(root for root in ROOTS if path.is_relative_to(root))
    return f"{root.name}/{path.relative_to(root).as_posix()}"


def iter_images() -> list[Path]:
    results: list[Path] = []
    for root in ROOTS:
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            if any(part.lower() in EXCLUDED_PARTS for part in path.parts):
                continue
            results.append(path)
    return sorted(results, key=lambda p: (event_group(p), p.name.lower()))


def inspect_image(path: Path) -> tuple[dict[str, object], Image.Image]:
    with Image.open(path) as opened:
        source_width, source_height = opened.size
        if path.suffix.lower() in {".jpg", ".jpeg"}:
            opened.draft("RGB", (640, 640))
        image = ImageOps.exif_transpose(opened).convert("RGB")
        width, height = (source_height, source_width) if image.width < image.height and source_width > source_height else (source_width, source_height)
        analysis = image.copy()
        analysis.thumbnail((320, 320), Image.Resampling.LANCZOS)
        gray = ImageOps.grayscale(analysis)
        stat = ImageStat.Stat(gray)
        entropy = float(gray.entropy())
        contrast = float(stat.stddev[0])
        luminance = float(stat.mean[0])
        orientation = "landscape" if width > height else "portrait" if height > width else "square"
        record = {
            "path": str(path),
            "relative_path": relative_label(path),
            "group": event_group(path),
            "filename": path.name,
            "extension": path.suffix.lower(),
            "width": width,
            "height": height,
            "orientation": orientation,
            "megapixels": round(width * height / 1_000_000, 2),
            "entropy": round(entropy, 3),
            "contrast": round(contrast, 3),
            "luminance": round(luminance, 3),
            "bytes": path.stat().st_size,
        }
        thumb = ImageOps.fit(image, (CELL_WIDTH - 10, IMAGE_HEIGHT), Image.Resampling.LANCZOS)
        return record, thumb


def draw_cell(sheet: Image.Image, index: int, thumb: Image.Image, record: dict[str, object]) -> None:
    draw = ImageDraw.Draw(sheet)
    col = index % COLS
    row = index // COLS
    x = col * CELL_WIDTH
    y = row * CELL_HEIGHT
    sheet.paste(thumb, (x + 5, y + 5))
    draw.rectangle((x + 5, y + 5, x + CELL_WIDTH - 5, y + IMAGE_HEIGHT + 5), outline="#d8d2c8", width=1)
    label = str(record["filename"])
    if len(label) > 21:
        label = f"{label[:18]}…"
    meta = f"{record['width']}×{record['height']} · H{record['entropy']}"
    draw.text((x + 7, y + IMAGE_HEIGHT + 9), label, font=FONT_LABEL, fill="#15171a")
    draw.text((x + 7, y + IMAGE_HEIGHT + 27), meta, font=FONT_LABEL, fill="#7c7066")


def save_sheet(group: str, page: int, records: list[dict[str, object]], thumbs: list[Image.Image]) -> Path:
    safe_group = "-".join(group.replace("/", " ").split())
    sheet = Image.new("RGB", (SHEET_WIDTH, SHEET_HEIGHT + 54), "#f4f1eb")
    draw = ImageDraw.Draw(sheet)
    for index, (record, thumb) in enumerate(zip(records, thumbs)):
        draw_cell(sheet, index, thumb, record)
    draw.rectangle((0, SHEET_HEIGHT, SHEET_WIDTH, SHEET_HEIGHT + 54), fill="#15171a")
    draw.text((22, SHEET_HEIGHT + 12), f"{group}  ·  sheet {page:02d}  ·  {len(records)} frames", font=FONT_GROUP, fill="#f4f1eb")
    output = SHEETS_DIR / f"{safe_group}-{page:02d}.jpg"
    sheet.save(output, "JPEG", quality=86, optimize=True)
    return output


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    SHEETS_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    images = iter_images()
    grouped_records: dict[str, list[dict[str, object]]] = defaultdict(list)
    grouped_thumbs: dict[str, list[Image.Image]] = defaultdict(list)
    errors: list[dict[str, str]] = []

    def inspect_safely(path: Path):
        try:
            return path, inspect_image(path), None
        except Exception as exc:  # keep the audit moving and report every unreadable source
            return path, None, str(exc)

    with ThreadPoolExecutor(max_workers=min(12, os.cpu_count() or 4)) as executor:
        for index, (path, inspected, error) in enumerate(executor.map(inspect_safely, images), start=1):
            if error is not None or inspected is None:
                errors.append({"path": str(path), "error": error or "unknown error"})
                continue
            record, thumb = inspected
            grouped_records[str(record["group"])].append(record)
            grouped_thumbs[str(record["group"])].append(thumb)
            if index % 100 == 0:
                print(f"inspected {index}/{len(images)}", flush=True)

    sheets: list[dict[str, object]] = []
    for group in sorted(grouped_records):
        records = grouped_records[group]
        thumbs = grouped_thumbs[group]
        for offset in range(0, len(records), PER_SHEET):
            page = offset // PER_SHEET + 1
            output = save_sheet(group, page, records[offset : offset + PER_SHEET], thumbs[offset : offset + PER_SHEET])
            sheets.append({"group": group, "page": page, "path": str(output), "count": min(PER_SHEET, len(records) - offset)})

    all_records = [record for records in grouped_records.values() for record in records]
    with (OUTPUT_ROOT / "manifest.csv").open("w", encoding="utf-8-sig", newline="") as csv_file:
        fields = list(all_records[0].keys()) if all_records else ["path"]
        writer = csv.DictWriter(csv_file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(all_records)

    shortlist: dict[str, list[dict[str, object]]] = {}
    for group, records in grouped_records.items():
        eligible = [record for record in records if record["orientation"] == "landscape" and record["megapixels"] >= 6]
        eligible.sort(
            key=lambda record: (
                abs(float(record["luminance"]) - 128),
                -float(record["entropy"]),
                -float(record["contrast"]),
            )
        )
        shortlist[group] = eligible[:24]

    summary = {
        "roots": [str(root) for root in ROOTS],
        "source_image_count": len(images),
        "readable_image_count": len(all_records),
        "excluded_output_duplicates": 225,
        "groups": {group: len(records) for group, records in sorted(grouped_records.items())},
        "sheets": sheets,
        "shortlist": shortlist,
        "errors": errors,
    }
    (OUTPUT_ROOT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"images": len(images), "readable": len(all_records), "sheets": len(sheets), "errors": len(errors)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
