#!/usr/bin/env python3
"""Build player-sheet.png from per-animation sprite strips."""

from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit('Pillow required: pip install pillow')

ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / 'public/assets/sprite'
OUT_PATH = ROOT / 'public/assets/images/player-sheet.png'

ANIMATIONS: list[tuple[str, int, str | None, list[int] | None]] = [
    ('idle', 8, 'player-idle.png', None),
    ('run', 6, 'player-run.png', None),
    ('jump', 1, 'player-jump.png', [3]),
    ('fall', 1, 'player-fall.png', [2]),
    ('attack', 2, 'player-attack.png', [2, 3]),
]


def load_strip(
    path: Path,
    expected_frames: int,
    fallback: Image.Image,
    frame_indices: list[int] | None = None,
) -> list[Image.Image]:
    if not path.exists():
        return [fallback.copy() for _ in range(expected_frames)]

    sheet = Image.open(path).convert('RGBA')
    frame_count = max(1, sheet.width // sheet.height)
    frame_w = sheet.width // frame_count
    frame_h = sheet.height

    frames = [
        sheet.crop((index * frame_w, 0, (index + 1) * frame_w, frame_h))
        for index in range(frame_count)
    ]

    if frame_indices is not None:
        selected = [frames[min(index, len(frames) - 1)] for index in frame_indices]
        if len(selected) >= expected_frames:
            return selected[:expected_frames]
        while len(selected) < expected_frames:
            selected.append(selected[-1].copy())
        return selected

    if len(frames) >= expected_frames:
        return frames[:expected_frames]

    while len(frames) < expected_frames:
        frames.append(frames[-1].copy())

    return frames


def main() -> None:
    idle_path = SPRITE_DIR / 'player-idle.png'
    if not idle_path.exists():
        raise SystemExit(f'Missing required idle strip: {idle_path}')

    idle_sheet = Image.open(idle_path).convert('RGBA')
    idle_frame_w = idle_sheet.width // 8
    idle_frame_h = idle_sheet.height
    placeholder = idle_sheet.crop((0, 0, idle_frame_w, idle_frame_h))

    all_frames: list[Image.Image] = []
    for name, expected_frames, file_name, frame_indices in ANIMATIONS:
        source_path = SPRITE_DIR / file_name if file_name else idle_path
        strip_frames = load_strip(source_path, expected_frames, placeholder, frame_indices)
        all_frames.extend(strip_frames)
        status = 'ok' if source_path.exists() else 'placeholder'
        print(f'{name}: {len(strip_frames)} frames ({status})')

    frame_w = all_frames[0].width
    frame_h = all_frames[0].height
    out = Image.new('RGBA', (frame_w * len(all_frames), frame_h))

    for index, frame in enumerate(all_frames):
        if frame.size != (frame_w, frame_h):
            frame = frame.resize((frame_w, frame_h), Image.NEAREST)
        out.paste(frame, (index * frame_w, 0))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT_PATH)
    print(
        f'Wrote {OUT_PATH} ({out.size[0]}x{out.size[1]}, '
        f'{len(all_frames)} frames, {frame_w}x{frame_h} each)'
    )


if __name__ == '__main__':
    main()
