#!/usr/bin/env python3
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
idle = Image.open(ROOT / 'public/assets/sprite/player-idle.png').convert('RGBA')
frame_w = idle.width // 8
frame0 = idle.crop((0, 0, frame_w, idle.height))
out = ROOT / 'public/assets/sprite/player-ref.png'
frame0.save(out)
print(f'Wrote {out} ({frame0.size[0]}x{frame0.size[1]}, {out.stat().st_size} bytes)')
