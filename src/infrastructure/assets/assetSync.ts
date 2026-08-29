import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

/**
 * Optional overrides for publishing or restoring runtime files through s3manager HTTPS.
 * Used as input to {@link pushAssets} and {@link pullAssets}; those functions return a void promise.
 */
export type AssetSyncOptions = {
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
  readonly listObjects?: ListS3managerObjects;
  readonly downloadObject?: DownloadS3managerObject;
};

/**
 * Local tree ↔ bucket prefix mapping (`public/assets/` ↔ `platformer-assets` / `assets/`).
 */
export const DEFAULT_ASSET_MIRROR = {
  localAssetsDir: 'public/assets',
  bucket: 'platformer-assets',
  objectPrefix: 'assets',
} as const;

/**
 * Admin host: Traefik BasicAuth in front of cloudlena/s3manager.
 * Instance `Default` matches the UI path `/Default/buckets/...`.
 */
export const DEFAULT_S3MANAGER_PUSH = {
  adminUrl: 'https://minio-adminer.balashov-maxim.ru',
  instance: 'Default',
} as const;

export type S3managerAuthInput = {
  readonly adminUrl: string;
  readonly instance: string;
  readonly bucket: string;
  readonly username: string;
  readonly password: string;
};

export type UploadS3managerObject = (
  input: S3managerAuthInput & {
    readonly objectKey: string;
    readonly fileName: string;
    readonly body: Uint8Array;
    readonly contentType: string;
  },
) => Promise<void>;

export type ListS3managerObjects = (
  input: S3managerAuthInput & { readonly objectPrefix: string },
) => Promise<readonly string[]>;

export type DownloadS3managerObject = (
  input: S3managerAuthInput & { readonly objectKey: string },
) => Promise<Uint8Array>;

type ResolvedS3managerAuth = S3managerAuthInput & {
  readonly localAssetsDir: string;
  readonly objectPrefix: string;
};

function nonEmpty(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

function posixJoin(...parts: string[]): string {
  return parts
    .map((part) => part.replaceAll('\\', '/').replace(/^\/+|\/+$/g, ''))
    .filter((part) => part.length > 0)
    .join('/');
}

function trimSlash(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function authorizationHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
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

async function resolveS3managerAuth(options?: AssetSyncOptions): Promise<ResolvedS3managerAuth> {
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

  return {
    adminUrl,
    instance,
    bucket,
    username,
    password,
    localAssetsDir,
    objectPrefix,
  };
}

function objectKeyFromDownloadPath(pathname: string, bucket: string): string | null {
  const marker = `/api/buckets/${bucket}/objects/`;
  const index = pathname.indexOf(marker);
  if (index < 0) {
    return null;
  }
  const rest = pathname.slice(index + marker.length);
  if (rest === '' || rest === 'bulk-download' || rest === 'bulk-delete') {
    return null;
  }
  if (rest.endsWith('/url') || rest.endsWith('/metadata') || rest.endsWith('/public-access')) {
    return null;
  }
  return decodeURIComponent(rest);
}

function folderPrefixFromBucketPath(
  pathname: string,
  instance: string,
  bucket: string,
): string | null {
  const marker = `/${instance}/buckets/${bucket}/`;
  const index = pathname.indexOf(marker);
  if (index < 0) {
    return null;
  }
  const rest = trimSlash(pathname.slice(index + marker.length));
  if (rest === '') {
    return null;
  }
  return rest;
}

/**
 * Collects object keys and folder prefixes from an s3manager bucket HTML page.
 */
export function parseS3managerBucketListing(
  html: string,
  bucket: string,
  instance: string,
): { readonly files: string[]; readonly folders: string[] } {
  const files = new Set<string>();
  const folders = new Set<string>();
  const hrefRe = /href="([^"]+)"/gi;
  let match = hrefRe.exec(html);
  while (match) {
    const href = (match[1] ?? '').replaceAll('&amp;', '&').split('?')[0] ?? '';
    let pathname = href;
    try {
      pathname = new URL(href, DEFAULT_S3MANAGER_PUSH.adminUrl).pathname;
    } catch {
      pathname = href;
    }
    const objectKey = objectKeyFromDownloadPath(pathname, bucket);
    if (objectKey !== null) {
      files.add(objectKey);
    } else {
      const folder = folderPrefixFromBucketPath(pathname, instance, bucket);
      if (folder !== null) {
        folders.add(folder);
      }
    }
    match = hrefRe.exec(html);
  }
  return { files: [...files].sort(), folders: [...folders].sort() };
}

async function s3managerFetch(
  url: string,
  username: string,
  password: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: authorizationHeader(username, password),
      ...init?.headers,
    },
  });
  if (response.status === 401) {
    throw new Error(`s3manager BasicAuth rejected (HTTP 401) for ${url}`);
  }
  return response;
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
  const response = await s3managerFetch(url, input.username, input.password, {
    method: 'POST',
    body: form,
  });
  if (response.status !== 201) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`s3manager upload failed HTTP ${String(response.status)} for ${input.objectKey}: ${detail}`);
  }
}

async function downloadViaS3managerHttp(input: Parameters<DownloadS3managerObject>[0]): Promise<Uint8Array> {
  const base = input.adminUrl.replace(/\/+$/, '');
  const encodedKey = input.objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `${base}/${encodeURIComponent(input.instance)}/api/buckets/${encodeURIComponent(input.bucket)}/objects/${encodedKey}`;
  const response = await s3managerFetch(url, input.username, input.password);
  if (response.status !== 200) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`s3manager download failed HTTP ${String(response.status)} for ${input.objectKey}: ${detail}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function listViaS3managerHttp(input: Parameters<ListS3managerObjects>[0]): Promise<string[]> {
  const base = input.adminUrl.replace(/\/+$/, '');
  const rootPrefix = trimSlash(input.objectPrefix);
  const queued = [rootPrefix];
  const queuedFolders = new Set<string>([rootPrefix]);
  const seenFolders = new Set<string>();
  const files = new Set<string>();

  while (queued.length > 0) {
    const prefix = queued.pop();
    if (prefix === undefined || seenFolders.has(prefix)) {
      continue;
    }
    seenFolders.add(prefix);
    for (let page = 1; page <= 100; page += 1) {
      const listUrl = `${base}/${encodeURIComponent(input.instance)}/buckets/${encodeURIComponent(input.bucket)}/${prefix}/?perPage=500&page=${String(page)}`;
      const response = await s3managerFetch(listUrl, input.username, input.password);
      if (response.status !== 200) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`s3manager list failed HTTP ${String(response.status)} for ${prefix}: ${detail}`);
      }
      const listing = parseS3managerBucketListing(await response.text(), input.bucket, input.instance);
      const newFiles = listing.files.filter((key) => !files.has(key));
      for (const key of listing.files) {
        files.add(key);
      }
      const newFolders = listing.folders.filter((folder) => !queuedFolders.has(folder));
      for (const folder of newFolders) {
        queuedFolders.add(folder);
        queued.push(folder);
      }
      if (newFiles.length === 0 && newFolders.length === 0) {
        break;
      }
    }
  }

  return [...files]
    .filter((key) => key === rootPrefix || key.startsWith(`${rootPrefix}/`))
    .filter((key) => !key.endsWith('/'))
    .sort();
}

/**
 * Publishes working-tree `public/assets/` through s3manager HTTPS (Traefik BasicAuth),
 * object keys `assets/<relative-path>` (`npm run assets:push` / pre-push).
 * @param options - Optional admin URL, BasicAuth, local dir, bucket, prefix.
 * @returns Resolves when local runtime files have been published to the bucket.
 */
export async function pushAssets(options?: AssetSyncOptions): Promise<void> {
  const auth = await resolveS3managerAuth(options);
  const upload = options?.uploadObject ?? uploadViaS3managerHttp;
  const files = listLocalRuntimeFiles(auth.localAssetsDir);
  for (const file of files) {
    const objectKey = posixJoin(auth.objectPrefix, file.relativePosix);
    const body = new Uint8Array(fs.readFileSync(file.absPath));
    await upload({
      adminUrl: auth.adminUrl,
      instance: auth.instance,
      bucket: auth.bucket,
      objectKey,
      fileName: path.basename(file.absPath),
      body,
      contentType: contentTypeFor(file.absPath),
      username: auth.username,
      password: auth.password,
    });
  }
}

/**
 * Writes bucket `platformer-assets` objects under `assets/` back into `public/assets/`
 * via s3manager HTTPS so `npm run dev` and `npm run validate:maps` can use them.
 * @param options - Optional admin URL, BasicAuth, and path overrides.
 * @returns Resolves when runtime files exist under `public/assets/`.
 */
export async function pullAssets(options?: AssetSyncOptions): Promise<void> {
  const auth = await resolveS3managerAuth(options);
  const list = options?.listObjects ?? listViaS3managerHttp;
  const download = options?.downloadObject ?? downloadViaS3managerHttp;
  const keys = await list({
    adminUrl: auth.adminUrl,
    instance: auth.instance,
    bucket: auth.bucket,
    username: auth.username,
    password: auth.password,
    objectPrefix: auth.objectPrefix,
  });
  const prefix = trimSlash(auth.objectPrefix);
  for (const objectKey of keys) {
    const relative = objectKey === prefix ? '' : objectKey.slice(prefix.length).replace(/^\//, '');
    if (relative === '' || relative.endsWith('/')) {
      continue;
    }
    const body = await download({
      adminUrl: auth.adminUrl,
      instance: auth.instance,
      bucket: auth.bucket,
      username: auth.username,
      password: auth.password,
      objectKey,
    });
    const dest = path.join(auth.localAssetsDir, ...relative.split('/'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body);
  }
}
