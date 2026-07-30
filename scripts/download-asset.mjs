#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2];
const out = process.argv[3];
if (!url || !out) {
  console.error('Usage: node download-asset.mjs <url> <output-path>');
  process.exit(1);
}

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Download failed: ${response.status}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buffer);
console.log(`Wrote ${out} (${buffer.length} bytes)`);
