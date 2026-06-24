from pathlib import Path
from collections import Counter

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "images" / "brand"
NAVY = (7, 21, 38, 255)
IVORY = (250, 247, 240, 255)
BLACK = (0, 0, 0, 255)


def is_near_white(red: int, green: int, blue: int) -> bool:
    max_channel = max(red, green, blue)
    min_channel = min(red, green, blue)
    saturation_delta = max_channel - min_channel
    warm_white_edge = (
        red > 220
        and green > 145
        and blue > 105
        and red - green < 105
        and green - blue < 80
    )

    return (
        (red > 220 and green > 220 and blue > 220)
        or (min_channel > 205 and saturation_delta <= 34)
        or warm_white_edge
    )


def is_smy_symbol_orange(red: int, green: int, blue: int) -> bool:
    return (
        red >= 120
        and green <= 165
        and blue <= 120
        and red - green >= 45
        and red - blue >= 70
    )


def is_smy_symbol_candidate(red: int, green: int, blue: int) -> bool:
    return (
        red >= 150
        and green <= 180
        and blue <= 150
        and red - green >= 30
        and red - blue >= 55
    )


def is_smy_symbol_solid_orange(red: int, green: int, blue: int) -> bool:
    return (
        red >= 160
        and green <= 130
        and blue <= 78
        and red - green >= 70
        and red - blue >= 95
    )


def remove_white_background(source: Path) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    pixels = []

    for red, green, blue, alpha in image.get_flattened_data():
        if alpha == 0:
            pixels.append((red, green, blue, alpha))
            continue

        if is_near_white(red, green, blue):
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))

    image.putdata(pixels)
    return image


def find_smy_orange_anchor(image: Image.Image, max_x: int) -> tuple[int, int, int]:
    colors: Counter[tuple[int, int, int]] = Counter()

    for index, (red, green, blue, alpha) in enumerate(image.get_flattened_data()):
        x = index % image.width
        if x < max_x and alpha > 0 and is_smy_symbol_solid_orange(red, green, blue):
            colors[(red, green, blue)] += 1

    return colors.most_common(1)[0][0] if colors else (235, 83, 8)


def unmatte_orange_edge(
    red: int,
    green: int,
    blue: int,
    anchor: tuple[int, int, int],
) -> tuple[int, int, int, int]:
    alpha_candidates = []

    for value, base in zip((red, green, blue), anchor, strict=True):
        denominator = 255 - base
        if denominator > 0:
            alpha_candidates.append((255 - value) / denominator)

    alpha_float = max(alpha_candidates) if alpha_candidates else 1
    alpha = max(0, min(255, round(alpha_float * 255)))

    if alpha < 28:
        return (*anchor, 0)

    return (*anchor, alpha)


def keep_smy_symbol_orange_only(
    image: Image.Image,
    max_x: int | None = None,
) -> Image.Image:
    cleaned = image.copy()
    pixels = []
    limit_x = cleaned.width if max_x is None else min(max_x, cleaned.width)
    anchor = find_smy_orange_anchor(cleaned, limit_x)

    for index, (red, green, blue, alpha) in enumerate(cleaned.get_flattened_data()):
        x = index % cleaned.width

        if alpha == 0 or x >= limit_x:
            pixels.append((red, green, blue, alpha))
            continue

        if is_smy_symbol_solid_orange(red, green, blue):
            pixels.append((red, green, blue, alpha))
            continue

        if is_smy_symbol_orange(red, green, blue) or is_smy_symbol_candidate(red, green, blue):
            pixels.append(unmatte_orange_edge(red, green, blue, anchor))
            continue

        pixels.append((red, green, blue, 0))

    cleaned.putdata(pixels)
    return cleaned


def trim_alpha(image: Image.Image, padding: int = 6) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()

    if bbox is None:
        return image

    left, top, right, bottom = bbox
    left = max(left - padding, 0)
    top = max(top - padding, 0)
    right = min(right + padding, image.width)
    bottom = min(bottom + padding, image.height)

    return image.crop((left, top, right, bottom))


def find_symbol_boundary(image: Image.Image, fallback_ratio: float) -> int:
    alpha = image.getchannel("A")
    non_empty = []

    for x in range(image.width):
        column_has_pixels = False
        for y in range(image.height):
            if alpha.getpixel((x, y)) > 8:
                column_has_pixels = True
                break
        non_empty.append(column_has_pixels)

    min_start = int(image.width * 0.16)
    max_end = int(image.width * 0.42)
    x = min_start

    while x < max_end:
        if non_empty[x]:
            x += 1
            continue

        gap_start = x
        while x < max_end and not non_empty[x]:
            x += 1
        gap_end = x

        if gap_end - gap_start >= 8 and any(non_empty[gap_end:max_end]):
            return max(gap_start, 1)

    return max(1, min(int(image.width * fallback_ratio), image.width))


def save_logo_assets(
    name: str,
    symbol_ratio: float,
    max_symbol_ratio: float | None = None,
) -> None:
    source = BRAND_DIR / f"{name}-logo.png"
    transparent = trim_alpha(remove_white_background(source))
    boundary = find_symbol_boundary(transparent, symbol_ratio)
    if max_symbol_ratio is not None:
        boundary = min(boundary, int(transparent.width * max_symbol_ratio))

    if name == "smyc":
        transparent = trim_alpha(keep_smy_symbol_orange_only(transparent, boundary))
        boundary = find_symbol_boundary(transparent, symbol_ratio)
        if max_symbol_ratio is not None:
            boundary = min(boundary, int(transparent.width * max_symbol_ratio))

    transparent_path = BRAND_DIR / f"{name}-logo-transparent.png"
    transparent.save(transparent_path)

    symbol = trim_alpha(transparent.crop((0, 0, boundary, transparent.height)), padding=4)
    if name == "smyc":
        symbol = trim_alpha(keep_smy_symbol_orange_only(symbol), padding=4)
    symbol_path = BRAND_DIR / f"{name}-symbol-transparent.png"
    symbol.save(symbol_path)

    print(f"{transparent_path.relative_to(ROOT)} {transparent.size[0]}x{transparent.size[1]}")
    print(f"{symbol_path.relative_to(ROOT)} {symbol.size[0]}x{symbol.size[1]}")


def fit_image(image: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(max_size, Image.Resampling.LANCZOS)
    return copy


def save_qa_image(
    logo_path: Path,
    output_path: Path,
    background: tuple[int, int, int, int],
) -> None:
    canvas = Image.new("RGBA", (760, 220), background)
    logo = fit_image(Image.open(logo_path).convert("RGBA"), (640, 140))
    x = (canvas.width - logo.width) // 2
    y = (canvas.height - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    canvas.save(output_path)
    print(f"{output_path.relative_to(ROOT)} {canvas.size[0]}x{canvas.size[1]}")


def save_qa_assets() -> None:
    save_qa_image(
        BRAND_DIR / "smyc-logo-transparent.png",
        BRAND_DIR / "qa-smyc-on-navy.png",
        NAVY,
    )
    save_qa_image(
        BRAND_DIR / "smyc-logo-transparent.png",
        BRAND_DIR / "qa-smyc-on-ivory.png",
        IVORY,
    )
    save_qa_image(
        BRAND_DIR / "smyc-symbol-transparent.png",
        BRAND_DIR / "qa-smyc-symbol-on-navy.png",
        NAVY,
    )
    save_qa_image(
        BRAND_DIR / "smyc-symbol-transparent.png",
        BRAND_DIR / "qa-smyc-symbol-on-black.png",
        BLACK,
    )
    save_qa_image(
        BRAND_DIR / "smyc-symbol-transparent.png",
        BRAND_DIR / "qa-smyc-symbol-on-ivory.png",
        IVORY,
    )
    save_qa_image(
        BRAND_DIR / "smf-logo-transparent.png",
        BRAND_DIR / "qa-smf-on-navy.png",
        NAVY,
    )
    save_qa_image(
        BRAND_DIR / "smf-logo-transparent.png",
        BRAND_DIR / "qa-smf-on-ivory.png",
        IVORY,
    )


def main() -> None:
    save_logo_assets("smyc", 0.225, max_symbol_ratio=0.225)
    save_logo_assets("smf", 0.2)
    save_qa_assets()


if __name__ == "__main__":
    main()
