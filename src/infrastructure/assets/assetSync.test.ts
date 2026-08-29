import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_ASSET_MIRROR,
  DEFAULT_S3MANAGER_PUSH,
  pullAssets,
  pushAssets,
  type AssetSyncOptions,
} from './index';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const MAP_RELATIVE = path.join('maps', 'level-01.json');
const IMAGE_RELATIVE = path.join('images', 'player-sheet.png');
const MAP_BODY = '{"width":2,"height":2}\n';
const IMAGE_BODY = 'fake-png-bytes';

const originalPath = process.env.PATH;
const originalMinioEndpoint = process.env.MINIO_ENDPOINT;
const originalMinioAccessKey = process.env.MINIO_ACCESS_KEY;
const originalMinioSecretKey = process.env.MINIO_SECRET_KEY;
const originalS3managerUrl = process.env.S3MANAGER_URL;
const originalS3managerUser = process.env.S3MANAGER_USER;
const originalS3managerPassword = process.env.S3MANAGER_PASSWORD;
const originalS3managerInstance = process.env.S3MANAGER_INSTANCE;

type FakeMcHarness = {
  readonly rootDir: string;
  readonly binDir: string;
  readonly storeRoot: string;
  readonly logPath: string;
  readonly localAssetsDir: string;
};

type RecordedUpload = {
  readonly authorization: string | undefined;
  readonly url: string | undefined;
  readonly pathField: string | undefined;
  readonly hasFile: boolean;
};

function restoreEnv(): void {
  if (originalPath === undefined) {
    delete process.env.PATH;
  } else {
    process.env.PATH = originalPath;
  }
  if (originalMinioEndpoint === undefined) {
    delete process.env.MINIO_ENDPOINT;
  } else {
    process.env.MINIO_ENDPOINT = originalMinioEndpoint;
  }
  if (originalMinioAccessKey === undefined) {
    delete process.env.MINIO_ACCESS_KEY;
  } else {
    process.env.MINIO_ACCESS_KEY = originalMinioAccessKey;
  }
  if (originalMinioSecretKey === undefined) {
    delete process.env.MINIO_SECRET_KEY;
  } else {
    process.env.MINIO_SECRET_KEY = originalMinioSecretKey;
  }
  if (originalS3managerUrl === undefined) {
    delete process.env.S3MANAGER_URL;
  } else {
    process.env.S3MANAGER_URL = originalS3managerUrl;
  }
  if (originalS3managerUser === undefined) {
    delete process.env.S3MANAGER_USER;
  } else {
    process.env.S3MANAGER_USER = originalS3managerUser;
  }
  if (originalS3managerPassword === undefined) {
    delete process.env.S3MANAGER_PASSWORD;
  } else {
    process.env.S3MANAGER_PASSWORD = originalS3managerPassword;
  }
  if (originalS3managerInstance === undefined) {
    delete process.env.S3MANAGER_INSTANCE;
  } else {
    process.env.S3MANAGER_INSTANCE = originalS3managerInstance;
  }
}

afterEach(() => {
  restoreEnv();
});

function writeExecutable(filePath: string, source: string): void {
  fs.writeFileSync(filePath, source, { encoding: 'utf8' });
  fs.chmodSync(filePath, 0o755);
}

/**
 * Fake `mc` on PATH. Covers extras `runMcMirror`, `resolveAssetSyncOptions`,
 * and `readMinioCredentialsFromEnv` through {@link pullAssets}.
 */
function createFakeMcHarness(): FakeMcHarness {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-asset-sync-'));
  const binDir = path.join(rootDir, 'bin');
  const storeRoot = path.join(rootDir, 'mc-store');
  const logPath = path.join(rootDir, 'mc.log');
  const localAssetsDir = path.join(rootDir, 'public', 'assets');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(storeRoot, { recursive: true });
  fs.mkdirSync(localAssetsDir, { recursive: true });

  const script = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const storeRoot = ${JSON.stringify(storeRoot)};
const logPath = ${JSON.stringify(logPath)};
const args = process.argv.slice(2);
fs.appendFileSync(logPath, JSON.stringify({ args, cwd: process.cwd() }) + '\\n');

function isRemote(p) {
  if (!p) return false;
  if (fs.existsSync(p)) return false;
  if (path.isAbsolute(p)) return false;
  return p.includes('/');
}

function remoteToLocal(remote) {
  const parts = String(remote).replace(/\\\\/g, '/').replace(/\\/+$/, '').split('/');
  const withoutAlias = parts.length > 2 ? parts.slice(1) : parts;
  return path.join(storeRoot, ...withoutAlias);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

if (args[0] === 'alias' && args[1] === 'set') {
  process.exit(0);
}

if (args[0] === 'mirror') {
  const positional = args.filter((a) => !a.startsWith('-'));
  const src = positional[1];
  const dest = positional[2];
  const srcLocal = isRemote(src) ? remoteToLocal(src) : src;
  const destLocal = isRemote(dest) ? remoteToLocal(dest) : dest;
  if (!fs.existsSync(srcLocal)) {
    console.error('fake-mc: source missing ' + srcLocal);
    process.exit(1);
  }
  copyDir(srcLocal, destLocal);
  process.exit(0);
}

console.error('fake-mc: unsupported ' + args.join(' '));
process.exit(1);
`;

  writeExecutable(path.join(binDir, 'mc'), script);
  process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ''}`;

  return { rootDir, binDir, storeRoot, logPath, localAssetsDir };
}

function seedLocalRuntimeFiles(localAssetsDir: string): void {
  const mapPath = path.join(localAssetsDir, MAP_RELATIVE);
  const imagePath = path.join(localAssetsDir, IMAGE_RELATIVE);
  fs.mkdirSync(path.dirname(mapPath), { recursive: true });
  fs.mkdirSync(path.dirname(imagePath), { recursive: true });
  fs.writeFileSync(mapPath, MAP_BODY);
  fs.writeFileSync(imagePath, IMAGE_BODY);
  fs.writeFileSync(path.join(localAssetsDir, '.gitkeep'), '');
}

function readMcLog(logPath: string): string {
  if (!fs.existsSync(logPath)) {
    return '';
  }
  return fs.readFileSync(logPath, 'utf8');
}

function extractMultipartPath(raw: string): string | undefined {
  const match = raw.match(/name="path"\r\n\r\n([^\r]*)/);
  return match?.[1];
}

async function listenS3managerStub(): Promise<{
  url: string;
  uploads: RecordedUpload[];
  close: () => Promise<void>;
}> {
  const uploads: RecordedUpload[] = [];
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('latin1');
      uploads.push({
        authorization: req.headers.authorization,
        url: req.url,
        pathField: extractMultipartPath(raw),
        hasFile: raw.includes('name="file"'),
      });
      res.statusCode = 201;
      res.end();
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('s3manager stub did not bind a port');
  }
  return {
    url: `http://127.0.0.1:${String(address.port)}`,
    uploads,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      }),
  };
}

describe('DEFAULT_ASSET_MIRROR', () => {
  it('maps public/assets to bucket platformer-assets prefix assets', () => {
    expect(DEFAULT_ASSET_MIRROR.localAssetsDir).toBe('public/assets');
    expect(DEFAULT_ASSET_MIRROR.bucket).toBe('platformer-assets');
    expect(DEFAULT_ASSET_MIRROR.objectPrefix).toBe('assets');
  });
});

describe('DEFAULT_S3MANAGER_PUSH', () => {
  it('targets the admin host instance Default', () => {
    expect(DEFAULT_S3MANAGER_PUSH.adminUrl).toBe('https://minio-adminer.balashov-maxim.ru');
    expect(DEFAULT_S3MANAGER_PUSH.instance).toBe('Default');
  });
});

describe('pushAssets', () => {
  it('POSTs each runtime file to s3manager with BasicAuth and assets/ object keys', async () => {
    const stub = await listenS3managerStub();
    const localAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-push-'));
    seedLocalRuntimeFiles(localAssetsDir);

    try {
      const options: AssetSyncOptions = {
        adminUrl: stub.url,
        username: 'ui-user',
        password: 'ui-pass',
        localAssetsDir,
        bucket: DEFAULT_ASSET_MIRROR.bucket,
        objectPrefix: DEFAULT_ASSET_MIRROR.objectPrefix,
      };

      await pushAssets(options);

      expect(stub.uploads).toHaveLength(2);
      const expectedAuth = `Basic ${Buffer.from('ui-user:ui-pass', 'utf8').toString('base64')}`;
      for (const upload of stub.uploads) {
        expect(upload.authorization).toBe(expectedAuth);
        expect(upload.hasFile).toBe(true);
        expect(upload.url).toBe('/Default/api/buckets/platformer-assets/objects');
      }
      const keys = stub.uploads.map((upload) => upload.pathField).sort();
      expect(keys).toEqual(['assets/images/player-sheet.png', 'assets/maps/level-01.json']);
    } finally {
      await stub.close();
    }
  });

  it('reads s3manager URL and BasicAuth from env when options omit credentials', async () => {
    const stub = await listenS3managerStub();
    const localAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-push-env-'));
    seedLocalRuntimeFiles(localAssetsDir);
    process.env.S3MANAGER_URL = stub.url;
    process.env.S3MANAGER_USER = 'env-user';
    process.env.S3MANAGER_PASSWORD = 'env-pass';

    try {
      await pushAssets({ localAssetsDir });
      expect(stub.uploads[0]?.authorization).toBe(
        `Basic ${Buffer.from('env-user:env-pass', 'utf8').toString('base64')}`,
      );
    } finally {
      await stub.close();
    }
  });

  it('prompts for BasicAuth when env is empty and a prompt is available', async () => {
    const localAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-push-prompt-'));
    seedLocalRuntimeFiles(localAssetsDir);
    delete process.env.S3MANAGER_USER;
    delete process.env.S3MANAGER_PASSWORD;
    const uploaded: string[] = [];

    await pushAssets({
      localAssetsDir,
      canPrompt: true,
      promptCredentials: async () => ({ username: 'prompt-user', password: 'prompt-pass' }),
      uploadObject: async (input) => {
        uploaded.push(`${input.username}:${input.password}:${input.objectKey}`);
      },
    });

    expect(uploaded.some((row) => row.startsWith('prompt-user:prompt-pass:'))).toBe(true);
  });

  it('fails without credentials when prompting is disabled', async () => {
    const localAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-push-noprompt-'));
    seedLocalRuntimeFiles(localAssetsDir);
    delete process.env.S3MANAGER_USER;
    delete process.env.S3MANAGER_PASSWORD;

    await expect(pushAssets({ localAssetsDir, canPrompt: false })).rejects.toThrow(/S3MANAGER_USER/);
  });
});

describe('pullAssets', () => {
  it('writes bucket objects under assets/ back into public/assets with the same relative paths', async () => {
    const harness = createFakeMcHarness();
    const objectRoot = path.join(harness.storeRoot, 'platformer-assets', 'assets');
    fs.mkdirSync(path.join(objectRoot, 'maps'), { recursive: true });
    fs.mkdirSync(path.join(objectRoot, 'images'), { recursive: true });
    fs.writeFileSync(path.join(objectRoot, MAP_RELATIVE), MAP_BODY);
    fs.writeFileSync(path.join(objectRoot, IMAGE_RELATIVE), IMAGE_BODY);

    await pullAssets({
      endpoint: 'http://127.0.0.1:9000',
      accessKey: 'test-access',
      secretKey: 'test-secret',
      localAssetsDir: harness.localAssetsDir,
      bucket: 'platformer-assets',
      objectPrefix: 'assets',
    });

    expect(fs.readFileSync(path.join(harness.localAssetsDir, MAP_RELATIVE), 'utf8')).toBe(MAP_BODY);
    expect(fs.readFileSync(path.join(harness.localAssetsDir, IMAGE_RELATIVE), 'utf8')).toBe(IMAGE_BODY);
  });
});

describe('assets-sync CLI (resolveAssetSyncCliCommand)', () => {
  it('pull argv restores runtime files into public/assets', () => {
    const harness = createFakeMcHarness();
    const objectRoot = path.join(harness.storeRoot, 'platformer-assets', 'assets');
    fs.mkdirSync(path.join(objectRoot, 'maps'), { recursive: true });
    fs.writeFileSync(path.join(objectRoot, MAP_RELATIVE), MAP_BODY);

    const wrapper = path.join(repoRoot, 'scripts/assets-sync.mjs');
    const result = spawnSync(process.execPath, [wrapper, 'pull'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${harness.binDir}${path.delimiter}${process.env.PATH ?? ''}`,
        MINIO_ENDPOINT: 'http://127.0.0.1:9000',
        MINIO_ACCESS_KEY: 'cli-access',
        MINIO_SECRET_KEY: 'cli-secret',
        ASSET_LOCAL_DIR: harness.localAssetsDir,
      },
      encoding: 'utf8',
      timeout: 60_000,
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(readMcLog(harness.logPath)).toMatch(/mirror/);
  });
});
