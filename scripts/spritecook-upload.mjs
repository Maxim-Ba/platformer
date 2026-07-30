import fs from 'node:fs';
import path from 'node:path';

const configPath = process.argv[2];
if (!configPath) {
  throw new Error('Usage: node spritecook-upload.mjs <config.json>');
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const filePath = path.resolve(config.filePath);
const body = fs.readFileSync(filePath);

const response = await fetch(config.uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': config.contentType ?? 'image/png' },
  body,
});

if (!response.ok) {
  const text = await response.text();
  throw new Error(`Upload failed: ${response.status} ${text}`);
}

console.log('UPLOAD_OK');
