import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

/**
 * Optional overrides for mirroring runtime files with `mc` (pull) or s3manager HTTP (push).
 * Accepts MinIO endpoint/credentials plus local directory, bucket, and object prefix.
 * Used as input to {@link pushAssets} and {@link pullAssets}; those functions return a void promise.
 */
export type AssetSyncOptions = {
  readonly endpoint?: string;
  readonly accessKey?: string;
  readonly secretKey?: string;
  readonly localAssetsDir?: string;
  readonly bucket?: string;
  readonly objectPrefix?: string;
  readonly adminUrl?: string;
  readonly instance?: string;
  readonly username?: string;
  readonly password?: string;
  readonly canPrompt?: boolean;
  readonly promptCredentials?: () => Promise<{ username: string; password: string }>;
  readonly uploadObject?: UploadS3managerObject;
};

/**
 * Default `mc mirror` mapping for local asset sync.
 * `localAssetsDir` is the working-tree tree; `bucket`/`objectPrefix` is `platformer-assets` + `assets/`.
 */
export const DEFAULT_ASSET_MIRROR = {
  localAssetsDir: 'public/assets',
  bucket: 'platformer-assets',
  objectPrefix: 'assets',
} as const;

/**
 * Laptop push target: Traefik BasicAuth in front of cloudlena/s3manager.
 * Instance `Default` matches the UI path `/Default/buckets/...`.
 */
export const DEFAULT_S3MANAGER_PUSH = {
  adminUrl: 'https://minio-adminer.balashov-maxim.ru',
  instance: 'Default',
} as const;

export type UploadS3managerObject = (input: {
  readonly adminUrl: string;
  readonly instance: string;
  readonly bucket: string;
  readonly objectKey: string;
  readonly fileName: string;
  readonly body: Uint8Array;
  readonly contentType: string;
  readonly username: string;
  readonly password: string;
}) => Promise<void>;

type ResolvedMcOptions = {
  readonly endpoint: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly localAssetsDir: string;
  readonly bucket: string;
  readonly objectPrefix: string;
};

type MinioEnvCredentials = {
  readonly endpoint: string | undefined;
  readonly accessKey: string | undefined;
  readonly secretKey: string | undefined;
};

const MC_ALIAS = 'local';

/**
 * Reads local MinIO env names (endpoint, access key, secret) without using live secrets.
 * Accepts process env implicitly. Returns placeholder credential fields.
 * Jenkins injects `MINIO_USER` / `MINIO_PASS`; local `.env.local` uses `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`.
 */
function readMinioCredentialsFromEnv(): MinioEnvCredentials {
  return {
    endpoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY ?? process.env.MINIO_USER,
    secretKey: process.env.MINIO_SECRET_KEY ?? process.env.MINIO_PASS,
  };
}

function requireCredential(value: string | undefined, name: string): string {
  if (value === undefined || value === '') {
    throw new Error(`Missing MinIO ${name} (set options or MINIO_* env)`);
  }
  return value;
}

function nonEmpty(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

/**
 * Merges caller options with {@link DEFAULT_ASSET_MIRROR} and env credentials.
 * @param options - Optional endpoint, keys, local dir, bucket, prefix.
 * @returns Fully resolved mirror endpoints for `mc`.
 */
function resolveAssetSyncOptions(options?: AssetSyncOptions): ResolvedMcOptions {
  const fromEnv = readMinioCredentialsFromEnv();
  return {
    endpoint: requireCredential(options?.endpoint ?? fromEnv.endpoint, 'endpoint'),
    accessKey: requireCredential(options?.accessKey ?? fromEnv.accessKey, 'accessKey'),
    secretKey: requireCredential(options?.secretKey ?? fromEnv.secretKey, 'secretKey'),
    localAssetsDir: options?.localAssetsDir ?? process.env.ASSET_LOCAL_DIR ?? DEFAULT_ASSET_MIRROR.localAssetsDir,
    bucket: options?.bucket ?? DEFAULT_ASSET_MIRROR.bucket,
    objectPrefix: options?.objectPrefix ?? DEFAULT_ASSET_MIRROR.objectPrefix,
  };
}

function runMc(args: readonly string[]): void {
  const result = spawnSync('mc', [...args], {
    encoding: 'utf8',
    env: process.env,
  });
  if (result.error) {
    throw new Error(`mc ${args.join(' ')} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || `exit ${String(result.status)}`;
    throw new Error(`mc ${args.join(' ')} failed: ${detail}`);
  }
}

/**
 * Runs `mc mirror` between the working tree and bucket `platformer-assets` prefix `assets/`.
 * @param resolved - Local dir, bucket, prefix, and credentials.
 * @param direction - `push` uploads local → bucket; `pull` downloads bucket → local.
 * @returns Resolves when the mirror finishes.
 */
async function runMcMirror(
  resolved: ResolvedMcOptions,
  direction: 'push' | 'pull',
): Promise<void> {
  const remote = `${MC_ALIAS}/${resolved.bucket}/${resolved.objectPrefix}`;
  const local = resolved.localAssetsDir;

  runMc(['alias', 'set', MC_ALIAS, resolved.endpoint, resolved.accessKey, resolved.secretKey]);

  if (direction === 'push') {
    runMc(['mirror', local, remote]);
  } else {
    runMc(['mirror', remote, local]);
  }
}

function posixJoin(...parts: string[]): string {
  return parts
    .map((part) => part.replaceAll('\\', '/').replace(/^\/+|\/+$/g, ''))
    .filter((part) => part.length > 0)
    .join('/');
}

function listLocalRuntimeFiles(localAssetsDir: string): { absPath: string; relativePosix: string }[] {
  if (!fs.existsSync(localAssetsDir)) {
    return [];
  }
  const found: { absPath: string; relativePosix: string }[] = [];
  const stack = [localAssetsDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (dir === undefined) {
      break;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(absPath);
        continue;
      }
      if (entry.name === '.gitkeep' || entry.name.startsWith('.')) {
        continue;
      }
      const relativePosix = path.relative(localAssetsDir, absPath).split(path.sep).join('/');
      found.push({ absPath, relativePosix });
    }
  }
  return found.sort((a, b) => a.relativePosix.localeCompare(b.relativePosix));
}

function contentTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.json') {
    return 'application/json';
  }
  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.svg') {
    return 'image/svg+xml';
  }
  if (ext === '.ogg') {
    return 'audio/ogg';
  }
  if (ext === '.mp3') {
    return 'audio/mpeg';
  }
  if (ext === '.wav') {
    return 'audio/wav';
  }
  return 'application/octet-stream';
}

async function promptS3managerCredentials(): Promise<{ username: string; password: string }> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  const question = (label: string): Promise<string> =>
    new Promise((resolve) => {
      rl.question(label, (answer) => {
        resolve(answer);
      });
    });
  try {
    const username = (await question('S3MANAGER_USER: ')).trim();
    const password = (await question('S3MANAGER_PASSWORD: ')).trim();
    if (username === '' || password === '') {
      throw new Error('S3MANAGER_USER and S3MANAGER_PASSWORD are required');
    }
    return { username, password };
  } finally {
    rl.close();
  }
}

/**
 * POST multipart `file` + `path` to cloudlena/s3manager HandleCreateObject.
 * Traefik BasicAuth uses the same username/password as the browser UI.
 */
async function uploadViaS3managerHttp(input: Parameters<UploadS3managerObject>[0]): Promise<void> {
  const base = input.adminUrl.replace(/\/+$/, '');
  const url = `${base}/${encodeURIComponent(input.instance)}/api/buckets/${encodeURIComponent(input.bucket)}/objects`;
  const form = new FormData();
  form.append('file', new Blob([input.body], { type: input.contentType }), input.fileName);
  form.append('path', input.objectKey);
  const authorization = `Basic ${Buffer.from(`${input.username}:${input.password}`, 'utf8').toString('base64')}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authorization },
    body: form,
  });
  if (response.status === 401) {
    throw new Error(`s3manager BasicAuth rejected (HTTP 401) for ${url}`);
  }
  if (response.status !== 201) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`s3manager upload failed HTTP ${String(response.status)} for ${input.objectKey}: ${detail}`);
  }
}

/**
 * Publishes working-tree `public/assets/` through s3manager HTTPS (Traefik BasicAuth),
 * object keys `assets/<relative-path>` (`npm run assets:push` / pre-push).
 * @param options - Optional admin URL, BasicAuth, local dir, bucket, prefix.
 * @returns Resolves when local runtime files have been published to the bucket.
 */
export async function pushAssets(options?: AssetSyncOptions): Promise<void> {
  const localAssetsDir =
    options?.localAssetsDir ?? process.env.ASSET_LOCAL_DIR ?? DEFAULT_ASSET_MIRROR.localAssetsDir;
  const bucket = options?.bucket ?? DEFAULT_ASSET_MIRROR.bucket;
  const objectPrefix = options?.objectPrefix ?? DEFAULT_ASSET_MIRROR.objectPrefix;
  const adminUrl =
    options?.adminUrl ?? nonEmpty(process.env.S3MANAGER_URL) ?? DEFAULT_S3MANAGER_PUSH.adminUrl;
  const instance =
    options?.instance ?? nonEmpty(process.env.S3MANAGER_INSTANCE) ?? DEFAULT_S3MANAGER_PUSH.instance;

  let username = options?.username ?? nonEmpty(process.env.S3MANAGER_USER);
  let password = options?.password ?? nonEmpty(process.env.S3MANAGER_PASSWORD);
  if (username === undefined || password === undefined) {
    const canPrompt = options?.canPrompt ?? Boolean(process.stdin.isTTY);
    if (!canPrompt && options?.promptCredentials === undefined) {
      throw new Error(
        'Missing S3MANAGER_USER / S3MANAGER_PASSWORD (set .env.local or run from a TTY to be prompted)',
      );
    }
    const prompted = await (options?.promptCredentials ?? promptS3managerCredentials)();
    username = username ?? prompted.username;
    password = password ?? prompted.password;
  }

  const upload = options?.uploadObject ?? uploadViaS3managerHttp;
  const files = listLocalRuntimeFiles(localAssetsDir);
  for (const file of files) {
    const objectKey = posixJoin(objectPrefix, file.relativePosix);
    const body = new Uint8Array(fs.readFileSync(file.absPath));
    await upload({
      adminUrl,
      instance,
      bucket,
      objectKey,
      fileName: path.basename(file.absPath),
      body,
      contentType: contentTypeFor(file.absPath),
      username,
      password,
    });
  }
}

/**
 * Writes bucket `platformer-assets` objects under `assets/` back into `public/assets/`
 * so `npm run dev` and `npm run validate:maps` can use them (`npm run assets:pull`).
 * @param options - Optional MinIO endpoint/keys and path overrides.
 * @returns Resolves when runtime files exist under `public/assets/`.
 */
export async function pullAssets(options?: AssetSyncOptions): Promise<void> {
  await runMcMirror(resolveAssetSyncOptions(options), 'pull');
}
