import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const STATEFUL_SET = 'k8s/minio/statefulset.yaml';
const SERVICE = 'k8s/minio/service.yaml';
const INIT_JOB = 'k8s/minio/job.yaml';
const SECRET_EXAMPLE = 'k8s/minio/secret.yaml.example';
const MIDDLEWARE = 'k8s/minio/middleware.yaml';
const INGRESS = 'k8s/ingress/ingress.yaml';

const GAME_HOST = 'platformer.balashov-maxim.ru';
const MINIO_IMAGE_PIN = /^minio\/minio:RELEASE\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/;
const PLACEHOLDER_SECRET = /^(changeme|REPLACE_ME)$/;

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function stripYamlComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('#')) {
        return '';
      }
      let inSingle = false;
      let inDouble = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === "'" && !inDouble) {
          inSingle = !inSingle;
        } else if (ch === '"' && !inSingle) {
          inDouble = !inDouble;
        } else if (ch === '#' && !inSingle && !inDouble) {
          return line.slice(0, i).trimEnd();
        }
      }
      return line;
    })
    .join('\n');
}

function yamlDocuments(source: string): string[] {
  return source
    .split(/^---\s*$/m)
    .map((doc) => doc.trim())
    .filter((doc) => doc.length > 0);
}

function yamlKind(document: string): string | undefined {
  return stripYamlComments(document).match(/^kind:\s*(\S+)/m)?.[1];
}

function metadataName(document: string): string | undefined {
  const stripped = stripYamlComments(document);
  const meta = stripped.match(/metadata:\s*\n((?:[ \t].*\n)+)/);
  return meta?.[1].match(/^\s*name:\s*(\S+)/m)?.[1];
}

function metadataNamespace(document: string): string | undefined {
  const stripped = stripYamlComments(document);
  const meta = stripped.match(/metadata:\s*\n((?:[ \t].*\n)+)/);
  return meta?.[1].match(/^\s*namespace:\s*(\S+)/m)?.[1];
}

function yamlBlock(source: string, key: string): string | undefined {
  const lines = stripYamlComments(source).split('\n');
  const start = lines.findIndex((line) => new RegExp(`^\\s*${key}:\\s*$`).test(line));
  if (start === -1) {
    return undefined;
  }
  const indent = lines[start].match(/^(\s*)/)?.[1].length ?? 0;
  const block = [lines[start]];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') {
      block.push(line);
      continue;
    }
    const lineIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (lineIndent <= indent) {
      break;
    }
    block.push(line);
  }
  return block.join('\n');
}

function collectK8sFiles(): { rel: string; raw: string }[] {
  const k8sRoot = path.join(repoRoot, 'k8s');
  const entries = fs.readdirSync(k8sRoot, { recursive: true, encoding: 'utf8' });
  return entries
    .filter((rel) => /\.ya?ml(\.example)?$/.test(rel.replaceAll('\\', '/')))
    .map((rel) => {
      const normalized = rel.replaceAll('\\', '/');
      return {
        rel: `k8s/${normalized}`,
        raw: fs.readFileSync(path.join(k8sRoot, rel), 'utf8'),
      };
    });
}

function allK8sDocuments(): { rel: string; doc: string }[] {
  return collectK8sFiles().flatMap((file) =>
    yamlDocuments(file.raw).map((doc) => ({ rel: file.rel, doc })),
  );
}

function splitStatefulSet(raw: string): { pod: string; claims: string } {
  const stripped = stripYamlComments(raw);
  const index = stripped.search(/^ {2}volumeClaimTemplates:/m);
  if (index === -1) {
    return { pod: stripped, claims: '' };
  }
  return { pod: stripped.slice(0, index), claims: stripped.slice(index) };
}

function imageLine(podYaml: string): string {
  const match = podYaml.match(/^\s*image:\s*(\S+)/m);
  expect(match, 'minio container image must be set').not.toBeNull();
  return match?.[1] ?? '';
}

function extractLiteralShellScript(raw: string): string {
  const lines = raw.split('\n');
  const pipeIndex = lines.findIndex((line) => /^\s*-\s+\|\s*$/.test(line));
  if (pipeIndex === -1) {
    return stripYamlComments(raw);
  }
  const pipeIndent = lines[pipeIndex].match(/^(\s*)/)?.[0].length ?? 0;
  const body: string[] = [];
  for (let i = pipeIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') {
      body.push('');
      continue;
    }
    const indent = line.match(/^(\s*)/)?.[0].length ?? 0;
    if (indent <= pipeIndent) {
      break;
    }
    body.push(line);
  }
  return stripYamlComments(body.join('\n'));
}

interface IngressPath {
  path: string;
  pathType: string;
  service: string;
  port: number;
}

function parseIngressPaths(document: string): IngressPath[] {
  const stripped = stripYamlComments(document);
  const chunks = stripped.split(/^\s*- path:/m).slice(1);
  return chunks.map((chunk) => {
    const pathMatch = chunk.match(/^\s*(\S+)/);
    const pathType = chunk.match(/pathType:\s*(\S+)/)?.[1] ?? '';
    const service = chunk.match(/name:\s*(\S+)/)?.[1] ?? '';
    const port = Number(chunk.match(/number:\s*(\d+)/)?.[1] ?? Number.NaN);
    return {
      path: pathMatch?.[1] ?? '',
      pathType,
      service,
      port,
    };
  });
}

function ingressLike(document: string): boolean {
  const kind = yamlKind(document);
  return kind === 'Ingress' || kind === 'IngressRoute';
}

function referencesMinioMediaMiddleware(document: string): boolean {
  const stripped = stripYamlComments(document);
  const annotation = stripped.match(
    /traefik\.ingress\.kubernetes\.io\/router\.middlewares:\s*(\S+)/,
  );
  if (annotation?.[1]?.includes('platformer-minio-media')) {
    return true;
  }
  return /middlewares:[\s\S]*platformer-minio-media/.test(stripped);
}

function ingressRouteBlocks(document: string): string[] {
  const stripped = stripYamlComments(document);
  if (yamlKind(document) !== 'IngressRoute') {
    return [];
  }
  return stripped
    .split(/^\s*- match:/m)
    .slice(1)
    .map((chunk) => `- match:${chunk}`);
}

function middlewareDocs(): string[] {
  return allK8sDocuments()
    .filter((entry) => yamlKind(entry.doc) === 'Middleware')
    .map((entry) => stripYamlComments(entry.doc));
}

function probeTargetsS3Api(probeYaml: string | undefined): boolean {
  if (!probeYaml) {
    return false;
  }
  return /port:\s*(9000|s3)\b/.test(probeYaml);
}

describe('MinIO Kubernetes manifests (slice A: tasks 1.1–1.4, 2.1–2.3)', () => {
  describe('1.1 StatefulSet platformer-minio and ClusterIP Service', () => {
    it('defines StatefulSet platformer-minio in namespace platformer', () => {
      const raw = readRepoFile(STATEFUL_SET);
      const docs = yamlDocuments(raw);
      const sts = docs.find((doc) => yamlKind(doc) === 'StatefulSet');

      expect(sts, `${STATEFUL_SET} must contain a StatefulSet`).toBeDefined();
      expect(metadataName(sts ?? '')).toBe('platformer-minio');
      expect(metadataNamespace(sts ?? '')).toBe('platformer');
    });

    it('pins official minio/minio to a real RELEASE.* date tag, not the unimplemented stub', () => {
      const { pod } = splitStatefulSet(readRepoFile(STATEFUL_SET));
      const image = imageLine(pod);

      expect(image).not.toMatch(/unimplemented/i);
      expect(image).toMatch(MINIO_IMAGE_PIN);
    });

    it('requests a 5Gi PVC via volumeClaimTemplates', () => {
      const { claims } = splitStatefulSet(readRepoFile(STATEFUL_SET));

      expect(claims).toMatch(/volumeClaimTemplates:/);
      expect(claims).toMatch(/storage:\s*5Gi\b/);
      expect(claims).toMatch(/ReadWriteOnce/);
    });

    it('exposes ClusterIP Service ports 9000 (S3) and 9001 (console)', () => {
      const raw = readRepoFile(SERVICE);
      const svc = yamlDocuments(raw).find((doc) => yamlKind(doc) === 'Service');

      expect(svc, `${SERVICE} must contain a Service`).toBeDefined();
      expect(metadataName(svc ?? '')).toBe('platformer-minio');
      expect(metadataNamespace(svc ?? '')).toBe('platformer');
      expect(stripYamlComments(svc ?? '')).toMatch(/type:\s*ClusterIP/);

      const ports = yamlBlock(svc ?? '', 'ports') ?? '';
      expect(ports).toMatch(/name:\s*s3[\s\S]*port:\s*9000/);
      expect(ports).toMatch(/name:\s*console[\s\S]*port:\s*9001/);
    });
  });

  describe('1.2 Secret example uses placeholders only', () => {
    it('keeps the example Secret on changeme / REPLACE_ME placeholders', () => {
      const raw = readRepoFile(SECRET_EXAMPLE);
      const secret = yamlDocuments(raw).find((doc) => yamlKind(doc) === 'Secret');
      const stripped = stripYamlComments(secret ?? '');

      expect(secret, `${SECRET_EXAMPLE} must contain a Secret`).toBeDefined();
      expect(metadataName(secret ?? '')).toBe('platformer-minio');
      expect(stripped).toMatch(/MINIO_ROOT_USER:\s*changeme\s*$/m);
      expect(stripped).toMatch(/MINIO_ROOT_PASSWORD:\s*REPLACE_ME\s*$/m);
    });

    it('documents that the live Secret comes from Jenkins credentials and is not committed', () => {
      const raw = readRepoFile(SECRET_EXAMPLE);

      expect(raw).toMatch(/Jenkins credentials/i);
      expect(raw).toMatch(/not committed/i);
      expect(fs.existsSync(path.join(repoRoot, 'k8s/minio/secret.yaml'))).toBe(false);
    });

    it('does not commit live-looking MinIO root keys in tracked k8s YAML', () => {
      for (const file of collectK8sFiles()) {
        const stripped = stripYamlComments(file.raw);
        const assignments = stripped.matchAll(/MINIO_ROOT_(?:USER|PASSWORD):\s*(\S+)/g);
        for (const match of assignments) {
          expect(
            match[1],
            `${file.rel} must not contain a live MinIO root value (got ${match[1]})`,
          ).toMatch(PLACEHOLDER_SECRET);
        }
      }
    });
  });

  describe('1.3 liveness/readiness probes and resource requests/limits', () => {
    it('configures liveness and readiness probes on S3 API port 9000', () => {
      const { pod } = splitStatefulSet(readRepoFile(STATEFUL_SET));
      const liveness = yamlBlock(pod, 'livenessProbe');
      const readiness = yamlBlock(pod, 'readinessProbe');

      expect(liveness, 'livenessProbe must be real YAML on the minio container, not a comment').toBeDefined();
      expect(
        readiness,
        'readinessProbe must be real YAML on the minio container, not a comment',
      ).toBeDefined();
      expect(probeTargetsS3Api(liveness)).toBe(true);
      expect(probeTargetsS3Api(readiness)).toBe(true);
      expect(liveness).not.toMatch(/port:\s*9001/);
      expect(readiness).not.toMatch(/port:\s*9001/);
    });

    it('sets CPU/memory requests and limits on the minio container', () => {
      const { pod } = splitStatefulSet(readRepoFile(STATEFUL_SET));
      const resources = yamlBlock(pod, 'resources');

      expect(resources, 'container resources must be present (not only PVC storage requests)').toBeDefined();
      expect(resources).toMatch(/requests:/);
      expect(resources).toMatch(/limits:/);
      expect(resources).toMatch(/cpu:/);
      expect(resources).toMatch(/memory:/);
      const requests = yamlBlock(resources ?? '', 'requests') ?? '';
      const limits = yamlBlock(resources ?? '', 'limits') ?? '';
      expect(requests).toMatch(/cpu:/);
      expect(requests).toMatch(/memory:/);
      expect(limits).toMatch(/cpu:/);
      expect(limits).toMatch(/memory:/);
    });
  });

  describe('1.4 init Job platformer-minio-init', () => {
    it('is a Job named platformer-minio-init in namespace platformer', () => {
      const raw = readRepoFile(INIT_JOB);
      const job = yamlDocuments(raw).find((doc) => yamlKind(doc) === 'Job');

      expect(job, `${INIT_JOB} must contain a Job`).toBeDefined();
      expect(metadataName(job ?? '')).toBe('platformer-minio-init');
      expect(metadataNamespace(job ?? '')).toBe('platformer');
    });

    it('runs a real wait + mc script, not a stub that only exits 1', () => {
      const script = extractLiteralShellScript(readRepoFile(INIT_JOB));
      const commands = script
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      expect(commands.length).toBeGreaterThan(0);
      expect(commands.join('\n')).not.toMatch(/^exit 1$/);
      expect(script).not.toMatch(/unimplemented/i);
      expect(script).toMatch(/\bmc\b/);
    });

    it('waits for the S3 API before mutating the bucket', () => {
      const script = extractLiteralShellScript(readRepoFile(INIT_JOB));

      expect(script).toMatch(/\buntil\b|\bwhile\b|\bmc ready\b/);
      expect(script).toMatch(/platformer-minio|9000|minio\/health/);
    });

    it('creates bucket platformer-assets with anonymous download-only GetObject under assets/', () => {
      const script = extractLiteralShellScript(readRepoFile(INIT_JOB));

      expect(script).toMatch(/\bmc\s+mb\b/);
      expect(script).toMatch(/platformer-assets/);
      expect(script).toMatch(/assets\//);
      const allowsGetObject =
        /\bGetObject\b/.test(script) || (/\banonymous\b/.test(script) && /\bdownload\b/.test(script));
      expect(allowsGetObject).toBe(true);
    });

    it('is idempotent when the bucket already exists', () => {
      const script = extractLiteralShellScript(readRepoFile(INIT_JOB));

      expect(script).toMatch(/--ignore-existing|\bignore-existing\b|\|\|\s*true\b|already exists/);
    });
  });

  describe('2.1 Ingress Prefix /media on the game host', () => {
    it('routes host Prefix /media to Service platformer-minio port 9000, not platformer-frontend', () => {
      const ingress = yamlDocuments(readRepoFile(INGRESS)).find((doc) => yamlKind(doc) === 'Ingress');
      expect(ingress, `${INGRESS} must contain an Ingress`).toBeDefined();
      expect(stripYamlComments(ingress ?? '')).toMatch(new RegExp(`host:\\s*${GAME_HOST}`));

      const paths = parseIngressPaths(ingress ?? '');
      const media = paths.find((entry) => entry.path === '/media');

      expect(media, 'Ingress must declare path /media').toBeDefined();
      expect(media?.pathType).toBe('Prefix');
      expect(media?.service).toBe('platformer-minio');
      expect(media?.service).not.toBe('platformer-frontend');
      expect(media?.port).toBe(9000);
    });

    it('keeps existing Prefix / on platformer-frontend port 80', () => {
      const ingressDocs = allK8sDocuments().filter((entry) => yamlKind(entry.doc) === 'Ingress');
      const root = ingressDocs
        .flatMap((entry) => parseIngressPaths(entry.doc))
        .find((entry) => entry.path === '/');

      expect(root, 'Ingress must still declare path /').toBeDefined();
      expect(root?.pathType).toBe('Prefix');
      expect(root?.service).toBe('platformer-frontend');
      expect(root?.port).toBe(80);
    });
  });

  describe('2.2 Traefik middleware strip /media and add /platformer-assets', () => {
    it('defines Middleware platformer-minio-media that strips /media and adds /platformer-assets', () => {
      const raw = readRepoFile(MIDDLEWARE);
      const named = yamlDocuments(raw).filter((doc) => yamlKind(doc) === 'Middleware');
      const chainHead = named.find((doc) => metadataName(doc) === 'platformer-minio-media');

      expect(chainHead, `${MIDDLEWARE} must define Middleware platformer-minio-media`).toBeDefined();
      expect(metadataNamespace(chainHead ?? '')).toBe('platformer');

      const combined = middlewareDocs().join('\n');
      expect(combined).toMatch(/stripPrefix:/);
      expect(combined).toMatch(/addPrefix:/);
      expect(combined).toMatch(/\/media\b/);
      expect(combined).toMatch(/\/platformer-assets\b/);
      expect(combined).not.toMatch(/unimplemented/i);
    });

    it('uses one Traefik type per Middleware and chains strip then add', () => {
      const raw = readRepoFile(MIDDLEWARE);
      const named = yamlDocuments(raw).filter((doc) => yamlKind(doc) === 'Middleware');
      const typeKeys = ['stripPrefix', 'addPrefix', 'chain', 'basicAuth', 'replacePathRegex'] as const;

      for (const doc of named) {
        const spec = yamlBlock(doc, 'spec') ?? '';
        const hits = typeKeys.filter((key) => new RegExp(`^\\s*${key}:`, 'm').test(spec));
        expect(hits, `${metadataName(doc)} must declare exactly one middleware type`).toHaveLength(1);
      }

      const chainHead = named.find((doc) => metadataName(doc) === 'platformer-minio-media') ?? '';
      const strip = named.find((doc) => metadataName(doc) === 'platformer-minio-media-strip') ?? '';
      const add = named.find((doc) => metadataName(doc) === 'platformer-minio-media-add') ?? '';

      expect(chainHead).toMatch(/chain:/);
      expect(strip).toMatch(/stripPrefix:/);
      expect(add).toMatch(/addPrefix:/);

      const stripPos = chainHead.indexOf('platformer-minio-media-strip');
      const addPos = chainHead.indexOf('platformer-minio-media-add');
      expect(stripPos).toBeGreaterThan(-1);
      expect(addPos).toBeGreaterThan(stripPos);
    });

    it('wires the middleware to Prefix /media only, not to /', () => {
      const ingressDocs = allK8sDocuments().filter((entry) => ingressLike(entry.doc));

      const mediaCovered = ingressDocs.some((entry) => {
        const kind = yamlKind(entry.doc);
        if (kind === 'IngressRoute') {
          return ingressRouteBlocks(entry.doc).some(
            (route) =>
              /PathPrefix\(`\/media`\)|PathPrefix\('\/media'\)/.test(route) &&
              referencesMinioMediaMiddleware(route),
          );
        }
        const paths = parseIngressPaths(entry.doc);
        return paths.some((p) => p.path === '/media') && referencesMinioMediaMiddleware(entry.doc);
      });
      expect(mediaCovered).toBe(true);

      const rootGetsRewrite = ingressDocs.some((entry) => {
        const kind = yamlKind(entry.doc);
        if (kind === 'IngressRoute') {
          return ingressRouteBlocks(entry.doc).some((route) => {
            const matchesRoot =
              /PathPrefix\(`\/`\)|PathPrefix\('\/'\)/.test(route) && !/PathPrefix\(`\/media`\)/.test(route);
            return matchesRoot && referencesMinioMediaMiddleware(route);
          });
        }
        const paths = parseIngressPaths(entry.doc);
        const hasRoot = paths.some((p) => p.path === '/');
        const hasMedia = paths.some((p) => p.path === '/media');
        if (!hasRoot) {
          return false;
        }
        if (hasMedia && referencesMinioMediaMiddleware(entry.doc)) {
          return true;
        }
        return !hasMedia && referencesMinioMediaMiddleware(entry.doc);
      });
      expect(rootGetsRewrite).toBe(false);
    });
  });

  describe('2.3 MinIO console is not on Ingress', () => {
    it('does not expose console port 9001 as an Ingress backend', () => {
      const paths = allK8sDocuments()
        .filter((entry) => yamlKind(entry.doc) === 'Ingress')
        .flatMap((entry) => parseIngressPaths(entry.doc));

      for (const entry of paths) {
        expect(entry.port, `${entry.path} must not route to MinIO console`).not.toBe(9001);
      }

      const ingressText = allK8sDocuments()
        .filter((entry) => ingressLike(entry.doc))
        .map((entry) => stripYamlComments(entry.doc))
        .join('\n');
      expect(ingressText).not.toMatch(/port:\s*9001/);
      expect(ingressText).not.toMatch(/targetPort:\s*9001/);
    });

    it('documents kubectl port-forward to :9001 in a k8s file', () => {
      const documented = collectK8sFiles().some(
        (file) => /port-forward/.test(file.raw) && /9001/.test(file.raw),
      );

      expect(documented).toBe(true);
    });
  });
});
