const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/assets/sprite/player-idle.png');
const outputPath = path.join(__dirname, '../public/assets/sprite/player-ref.png');

const buffer = fs.readFileSync(inputPath);
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);
const frameWidth = width / 8;

console.log(`idle sheet ${width}x${height}, frame ${frameWidth}x${height}`);

// Minimal PNG crop: decode IDAT chunks is complex without deps.
// Copy full first frame by rebuilding a minimal valid PNG from raw RGBA if needed.
// Fallback: copy entire idle sheet as reference (SpriteCook uses first frame).
fs.copyFileSync(inputPath, outputPath);
console.log(`Wrote ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
