#!/usr/bin/env python3
"""Generate a minimal 2-tile platformer tileset PNG."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path


def write_png(path: Path, width: int, height: int, pixels: list[tuple[int, int, int]]) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = b""
    for y in range(height):
        raw += b"\x00"
        for x in range(width):
            raw += bytes(pixels[y * width + x])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def main() -> None:
    width, height = 64, 32
    pixels: list[tuple[int, int, int]] = []
    for y in range(height):
        for x in range(width):
            if x < 32:
                pixels.append((120, 113, 108))
            else:
                pixels.append((74, 222, 128))

    out = Path(__file__).resolve().parents[1] / "public/assets/tilesets/platformer-tiles.png"
    write_png(out, width, height, pixels)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
