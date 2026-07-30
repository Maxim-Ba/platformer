#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPRITE_DIR = path.join(ROOT, 'public/assets/sprite');
const OUT_PATH = path.join(ROOT, 'public/assets/images/player-sheet.png');

const ANIMATIONS = [
  { name: 'idle', count: 8, file: 'player-idle.png', indices: null },
  { name: 'run', count: 6, file: 'player-run.png', indices: null },
  { name: 'jump', count: 1, file: 'player-jump.png', indices: [3] },
  { name: 'fall', count: 1, file: 'player-fall.png', indices: [2] },
  { name: 'attack', count: 2, file: 'player-attack.png', indices: [2, 3] },
];

async function loadFrames(file, count, indices) {
  const filePath = path.join(SPRITE_DIR, file);
  const meta = await sharp(filePath).metadata();
  const frameCount = Math.max(1, Math.floor(meta.width / meta.height));
  const frameW = Math.floor(meta.width / frameCount);
  const frameH = meta.height;
  const pick = indices ?? Array.from({ length: count }, (_, index) => index);
  const frames = [];

  for (const index of pick.slice(0, count)) {
    const safeIndex = Math.min(index, frameCount - 1);
    frames.push(
      await sharp(filePath)
        .extract({ left: safeIndex * frameW, top: 0, width: frameW, height: frameH })
        .png()
        .toBuffer(),
    );
  }

  while (frames.length < count) {
    frames.push(frames[frames.length - 1]);
  }

  return frames;
}

async function main() {
  const allFrames = [];

  for (const animation of ANIMATIONS) {
    const frames = await loadFrames(animation.file, animation.count, animation.indices);
    allFrames.push(...frames);
    console.log(`${animation.name}: ${frames.length} frames`);
  }

  const firstMeta = await sharp(allFrames[0]).metadata();
  const frameW = firstMeta.width ?? 172;
  const frameH = firstMeta.height ?? 172;

  const composites = allFrames.map((buffer, index) => ({
    input: buffer,
    left: index * frameW,
    top: 0,
  }));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  await sharp({
    create: {
      width: frameW * allFrames.length,
      height: frameH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(OUT_PATH);

  console.log(
    `Wrote ${OUT_PATH} (${frameW * allFrames.length}x${frameH}, ${allFrames.length} frames)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
