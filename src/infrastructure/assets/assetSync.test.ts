import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_ASSET_MIRROR,
  DEFAULT_S3MANAGER_PUSH,
  parseS3managerBucketListing,
  pullAssets,
  pushAssets,
  type AssetSyncOptions,
} from './index';

const MAP_RELATIVE = path.join('maps', 'level-01.json');
const IMAGE_RELATIVE = path.join('images', 'player-sheet.png');
const MAP_BODY = '{"width":2,"height":2}\n';
const IMAGE_BODY = 'fake-png-bytes';

const originalS3managerUrl = process.env.S3MANAGER_URL;
const originalS3managerUser = process.env.S3MANAGER_USER;
const originalS3managerPassword = process.env.S3MANAGER_PASSWORD;
const originalS3managerInstance = process.env.S3MANAGER_INSTANCE;

type RecordedUpload = {
  readonly authorization: string | undefined;
  readonly url: string | undefined;
  readonly pathField: string | undefined;
  readonly hasFile: boolean;
};

function restoreEnv(): void {
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

function seedLocalRuntimeFiles(localAssetsDir: string): void {
  const mapPath = path.join(localAssetsDir, MAP_RELATIVE);
  const imagePath = path.join(localAssetsDir, IMAGE_RELATIVE);
  fs.mkdirSync(path.dirname(mapPath), { recursive: true });
  fs.mkdirSync(path.dirname(imagePath), { recursive: true });
  fs.writeFileSync(mapPath, MAP_BODY);
  fs.writeFileSync(imagePath, IMAGE_BODY);
  fs.writeFileSync(path.join(localAssetsDir, '.gitkeep'), '');
}

function extractMultipartPath(raw: string): string | undefined {
  const match = raw.match(/name="path"\r\n\r\n([^\r]*)/);
  return match?.[1];
}

function listingHtml(): string {
  return `
    <a href="/Default/buckets/platformer-assets/">up</a>
    <a href="/Default/api/buckets/platformer-assets/objects/assets/maps/level-01.json">Download</a>
    <a href="/Default/api/buckets/platformer-assets/objects/assets/images/player-sheet.png">Download</a>
    <a href="/Default/api/buckets/platformer-assets/objects/assets/maps/level-01.json/url">link</a>
  `;
}

async function listenS3managerStub(): Promise<{
  url: string;
  uploads: RecordedUpload[];
  close: () => Promise<void>;
}> {
  const uploads: RecordedUpload[] = [];
  const objects: Record<string, string> = {
    'assets/maps/level-01.json': MAP_BODY,
    'assets/images/player-sheet.png': IMAGE_BODY,
  };
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '';
    if (req.method === 'GET' && url.includes('/api/buckets/platformer-assets/objects/')) {
      const key = decodeURIComponent(url.split('/objects/')[1]?.split('?')[0] ?? '');
      const body = objects[key];
      if (body === undefined) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.statusCode = 200;
      res.end(body);
      return;
    }
    if (req.method === 'GET' && url.includes('/buckets/platformer-assets/')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(listingHtml());
      return;
    }
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

describe('parseS3managerBucketListing', () => {
  it('collects object download hrefs and skips url/metadata helpers', () => {
    const listing = parseS3managerBucketListing(listingHtml(), 'platformer-assets', 'Default');
    expect(listing.files).toEqual(['assets/images/player-sheet.png', 'assets/maps/level-01.json']);
    expect(listing.folders).toEqual([]);
  });

  it('normalizes absolute s3manager hrefs and keeps invalid hrefs as raw paths', () => {
    const html = `
      <a href="https://minio-adminer.example/Default/api/buckets/platformer-assets/objects/assets/maps/level-01.json?download=1">Download</a>
      <a href="https://[">broken</a>
      <a href="/Default/buckets/platformer-assets/assets/maps">folder</a>
    `;
    const listing = parseS3managerBucketListing(html, 'platformer-assets', 'Default');
    expect(listing.files).toEqual(['assets/maps/level-01.json']);
    expect(listing.folders).toEqual(['assets/maps']);
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
    const stub = await listenS3managerStub();
    const localAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-pull-'));

    try {
      await pullAssets({
        adminUrl: stub.url,
        username: 'ui-user',
        password: 'ui-pass',
        localAssetsDir,
        bucket: 'platformer-assets',
        objectPrefix: 'assets',
      });

      expect(fs.readFileSync(path.join(localAssetsDir, MAP_RELATIVE), 'utf8')).toBe(MAP_BODY);
      expect(fs.readFileSync(path.join(localAssetsDir, IMAGE_RELATIVE), 'utf8')).toBe(IMAGE_BODY);
    } finally {
      await stub.close();
    }
  });
});
