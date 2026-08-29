import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Operator seed from the laptop: npm run assets:push POSTs public/assets
//   to s3manager (https://minio-adminer.balashov-maxim.ru) as platformer-assets/assets.
// Jenkins assets:pull still uses mc against the in-cluster S3 API.
// Operator 7.5 local verify: npm run assets:pull && npm run validate:maps && npm test && npm run build
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'src/infrastructure/assets/runAssetSyncCli.ts');

const result = spawnSync('npx', ['vite-node', entry, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
