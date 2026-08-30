#!/usr/bin/env python3
"""Build enemy-*-sheet.png from per-animation sprite strips."""

from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit('Pillow required: pip install pillow')

ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / 'public/assets/sprite'
OUT_DIR = ROOT / 'public/assets/images'

ArchetypeAnims = list[tuple[str, int, str]]

ARCHETYPES: list[tuple[str, ArchetypeAnims]] = [
    (
        'grunt',
        [
            ('idle', 8, 'enemy-grunt-idle.png'),
            ('walk', 8, 'enemy-grunt-walk.png'),
        ],
    ),
    (
        'flyer',
        [
            ('fly', 8, 'enemy-flyer-fly.png'),
        ],
    ),
    (
        'caster',
        [
            ('idle', 8, 'enemy-caster-idle.png'),
            ('attack', 8, 'enemy-caster-attack.png'),
        ],
    ),
]


def load_strip(
    path: Path,
    expected_frames: int,
    fallback: Image.Image | None,
) -> list[Image.Image]:
    if not path.exists():
        if fallback is None:
            raise SystemExit(f'Missing required enemy strip: {path}')
        return [fallback.copy() for _ in range(expected_frames)]

    sheet = Image.open(path).convert('RGBA')
    frame_count = max(1, sheet.width // sheet.height)
    frame_w = sheet.width // frame_count
    frame_h = sheet.height

    frames = [
        sheet.crop((index * frame_w, 0, (index + 1) * frame_w, frame_h))
        for index in range(frame_count)
    ]

    if len(frames) >= expected_frames:
        return frames[:expected_frames]

    while len(frames) < expected_frames:
        frames.append(frames[-1].copy())

    return frames


def build_archetype(name: str, animations: ArchetypeAnims) -> None:
    first_path = SPRITE_DIR / animations[0][2]
    if not first_path.exists():
        raise SystemExit(f'Missing required {name} strip: {first_path}')

    first_sheet = Image.open(first_path).convert('RGBA')
    first_frame_count = max(1, first_sheet.width // first_sheet.height)
    frame_w = first_sheet.width // first_frame_count
    frame_h = first_sheet.height
    placeholder = first_sheet.crop((0, 0, frame_w, frame_h))

    all_frames: list[Image.Image] = []
    for anim_name, expected_frames, file_name in animations:
        source_path = SPRITE_DIR / file_name
        strip_frames = load_strip(source_path, expected_frames, placeholder)
        all_frames.extend(strip_frames)
        status = 'ok' if source_path.exists() else 'placeholder'
        print(f'{name} {anim_name}: {len(strip_frames)} frames ({status})')

    out = Image.new('RGBA', (frame_w * len(all_frames), frame_h))
    for index, frame in enumerate(all_frames):
        if frame.size != (frame_w, frame_h):
            frame = frame.resize((frame_w, frame_h), Image.NEAREST)
        out.paste(frame, (index * frame_w, 0))

    out_path = OUT_DIR / f'enemy-{name}-sheet.png'
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out.save(out_path)
    print(
        f'Wrote {out_path} ({out.size[0]}x{out.size[1]}, '
        f'{len(all_frames)} frames, {frame_w}x{frame_h} each)'
    )


def main() -> None:
    for name, animations in ARCHETYPES:
        build_archetype(name, animations)


if __name__ == '__main__':
    main()
