from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "Downloads" / "생성된 이미지 1 (1).png"
MOTION_SOURCE = ROOT / "public" / "images" / "effects" / "conductor-hand-motion-source.png"
AI_GRID_SOURCE = ROOT / "public" / "images" / "effects" / "conductor-hand-motion-ai-20-source.png"
OUT_DIR = ROOT / "public" / "images" / "effects"


def is_warm_hand_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a == 0:
        return False

    # Keep warm gold/brown line art and shaded hand texture, remove navy background.
    return r > 42 and g > 28 and r > b * 1.45 and g > b * 1.08


def transparent_crop(source: Image.Image, box: tuple[int, int, int, int], output: Path) -> None:
    cropped = source.crop(box).convert("RGBA")
    pixels = cropped.load()
    width, height = cropped.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if is_warm_hand_pixel(r, g, b, a):
                warm = max(r, g)
                alpha = min(255, max(70, int((warm - 28) * 2.2)))
                pixels[x, y] = (r, g, b, alpha)
            else:
                pixels[x, y] = (r, g, b, 0)

    cropped.save(output)


def transparent_image(source: Image.Image) -> Image.Image:
    output = source.convert("RGBA")
    pixels = output.load()
    width, height = output.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if is_warm_hand_pixel(r, g, b, a):
                warm = max(r, g)
                alpha = min(255, max(76, int((warm - 30) * 2.25)))
                pixels[x, y] = (r, g, b, alpha)
            else:
                pixels[x, y] = (r, g, b, 0)

    return output


def content_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return (0, 0, image.width, image.height)

    left, top, right, bottom = bbox
    padding_x = 26
    padding_y = 24
    return (
        max(0, left - padding_x),
        max(0, top - padding_y),
        min(image.width, right + padding_x),
        min(image.height, bottom + padding_y),
    )


def dilate(mask: list[list[bool]], iterations: int) -> list[list[bool]]:
    height = len(mask)
    width = len(mask[0])
    current = mask

    for _ in range(iterations):
        next_mask = [[False] * width for _ in range(height)]
        for y in range(height):
            for x in range(width):
                if not current[y][x]:
                    continue

                for ny in range(max(0, y - 1), min(height, y + 2)):
                    for nx in range(max(0, x - 1), min(width, x + 2)):
                        next_mask[ny][nx] = True
        current = next_mask

    return current


def fill_silhouette_from_lines(image: Image.Image) -> Image.Image:
    width, height = image.size
    pixels = image.load()
    warm_mask = [[False] * width for _ in range(height)]

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            warm_mask[y][x] = is_warm_hand_pixel(r, g, b, a)

    closed_mask = dilate(warm_mask, 7)
    background = [[False] * width for _ in range(height)]
    stack: list[tuple[int, int]] = []

    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    while stack:
        x, y = stack.pop()
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
        if background[y][x] or closed_mask[y][x]:
            continue

        background[y][x] = True
        stack.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            is_hand_area = warm_mask[y][x] or not background[y][x]

            if not is_hand_area:
                pixels[x, y] = (r, g, b, 0)
                continue

            if warm_mask[y][x]:
                warm = max(r, g)
                alpha = min(255, max(112, int((warm - 26) * 2.35)))
                pixels[x, y] = (r, g, b, alpha)
            else:
                # Keep the dark shaded hand body so fingers stay connected.
                pixels[x, y] = (r, g, b, 210)

    return image


def transparent_motion_crop(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return fill_silhouette_from_lines(source.crop(box).convert("RGBA"))


def normalized_frame(source: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    bbox = source.getchannel("A").getbbox()
    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))

    if bbox is None:
        return canvas

    cropped = source.crop(bbox)
    max_width = int(target_size[0] * 0.86)
    max_height = int(target_size[1] * 0.9)
    scale = min(max_width / cropped.width, max_height / cropped.height)
    resized = cropped.resize(
        (max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    offset_x = (target_size[0] - resized.width) // 2
    offset_y = target_size[1] - resized.height - int(target_size[1] * 0.05)
    canvas.alpha_composite(resized, (offset_x, max(0, offset_y)))
    return canvas


def fixed_panel_frame(source: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    scale = min(target_size[0] / source.width, target_size[1] / source.height)
    resized = source.resize(
        (max(1, int(source.width * scale)), max(1, int(source.height * scale))),
        Image.Resampling.LANCZOS,
    )
    offset_x = (target_size[0] - resized.width) // 2
    offset_y = (target_size[1] - resized.height) // 2
    canvas.alpha_composite(resized, (offset_x, offset_y))
    return canvas


def clear_existing_motion_frames() -> None:
    for existing_frame in OUT_DIR.glob("conductor-hand-frame-*.png"):
        existing_frame.unlink()


def generate_ai_grid_frames() -> bool:
    if not AI_GRID_SOURCE.exists():
        return False

    source = Image.open(AI_GRID_SOURCE).convert("RGBA")
    columns = 5
    rows = 4
    frame_width = 350
    frame_height = 724
    cell_width = source.width / columns
    cell_height = source.height / rows
    inset_x = max(2, int(cell_width * 0.04))
    inset_y = max(2, int(cell_height * 0.04))

    clear_existing_motion_frames()

    frame_index = 1
    for row in range(rows):
        for column in range(columns):
            left = int(column * cell_width) + inset_x
            top = int(row * cell_height) + inset_y
            right = int((column + 1) * cell_width) - inset_x
            bottom = int((row + 1) * cell_height) - inset_y
            transparent = transparent_motion_crop(source, (left, top, right, bottom))
            frame = fixed_panel_frame(transparent, (frame_width, frame_height))
            frame.save(OUT_DIR / f"conductor-hand-frame-{frame_index}.png")
            frame_index += 1

    return True


def generate_motion_frames() -> None:
    if generate_ai_grid_frames():
        return

    if not MOTION_SOURCE.exists():
        return

    source = Image.open(MOTION_SOURCE).convert("RGBA")
    frame_width = 350
    frame_height = source.height
    # These boxes use the visual gutters between the generated hands, not alpha bounds.
    # That prevents both problems: fingers getting cropped and the next hand leaking in.
    hand_runs = [
        (28, 378),
        (378, 694),
        (694, 1002),
        (1002, 1294),
        (1294, 1588),
        (1588, 1882),
        (1882, 2172),
    ]

    clear_existing_motion_frames()

    base_frames: list[Image.Image] = []

    for left, right in hand_runs[:7]:
        transparent = transparent_motion_crop(
            source,
            (
                max(0, left),
                0,
                min(source.width, right),
                source.height,
            ),
        )
        frame = Image.new("RGBA", (frame_width, frame_height), (0, 0, 0, 0))
        offset_x = (frame_width - transparent.width) // 2
        frame.alpha_composite(transparent, (offset_x, 0))
        base_frames.append(frame)

    output_frames: list[Image.Image] = []

    for index, frame in enumerate(base_frames):
        output_frames.append(frame)

        if index < len(base_frames) - 1:
            next_frame = base_frames[index + 1]
            output_frames.append(Image.blend(frame, next_frame, 0.25))
            output_frames.append(Image.blend(frame, next_frame, 0.5))
            output_frames.append(Image.blend(frame, next_frame, 0.75))

    for index, frame in enumerate(output_frames):
        frame.save(OUT_DIR / f"conductor-hand-frame-{index + 1}.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_motion_frames()

    if SOURCE.exists():
        source = Image.open(SOURCE).convert("RGBA")

        # Crops are intentionally generous to preserve wrist and finger silhouette.
        try:
            transparent_crop(source, (145, 110, 750, 930), OUT_DIR / "conductor-open-hand.png")
            transparent_crop(source, (840, 145, 1325, 920), OUT_DIR / "conductor-fist-hand.png")
        except OSError:
            # Motion frames are the production assets. These legacy stills are optional.
            pass


if __name__ == "__main__":
    main()
