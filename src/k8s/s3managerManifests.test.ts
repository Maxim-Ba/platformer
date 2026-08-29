import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  S3MANAGER_AUTH_SECRET_EXAMPLE_FILE,
  S3MANAGER_AUTH_SECRET_NAME,
  S3MANAGER_BOOTSTRAP_STAGE,
  S3MANAGER_DEPLOYMENT_FILE,
  S3MANAGER_DEPLOYMENT_NAME,
  S3MANAGER_INGRESS_FILE,
  S3MANAGER_INGRESS_HOST,
  S3MANAGER_INGRESS_NAME,
  S3MANAGER_JENKINS_CREDENTIAL_ID,
  S3MANAGER_MIDDLEWARE_FILE,
  S3MANAGER_MIDDLEWARE_NAME,
  S3MANAGER_NAMESPACE,
  S3MANAGER_SERVICE_FILE,
  S3MANAGER_SERVICE_NAME,
  S3MANAGER_UI_PORT,
} from './s3managerManifests';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const GAME_INGRESS_FILE = 'k8s/ingress/ingress.yaml';
const GAME_HOST = 'platformer.balashov-maxim.ru';
const GAME_TLS_SECRET = 'platformer-balashov-maxim-tls';
const MINIO_SECRET_NAME = 'platformer-minio';
const MINIO_S3_ENDPOINT = 'platformer-minio:9000';
const STAGE_MINIO_INIT = 'MinIO Init';
const PLACEHOLDER_SECRET = /^(changeme|REPLACE_ME)$/;
const LIVE_HTPASSWD = /\$2[aby]\$|\$apr1\$|\{SHA\}/;
const RELEASED_S3MANAGER_IMAGE = /^cloudlena\/s3manager:v?\d+\.\d+\.\d+$/;
const STUB_DOC_STATUS =
  /\bUNIMPLEMENTED\b|coder fills operator steps|coder writes the operator path|Do not treat this heading as done/i;

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8').replaceAll('\r\n', '\n');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertNoStubStatus(source: string, label: string): void {
  expect(source, `${label} must not keep UNIMPLEMENTED as the operator-path status`).not.toMatch(
    STUB_DOC_STATUS,
  );
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

function findKind(relativePath: string, kind: string): string {
  const match = yamlDocuments(readRepoFile(relativePath)).find((doc) => yamlKind(doc) === kind);
  expect(match, `${relativePath} must contain kind ${kind}`).toBeDefined();
  return match ?? '';
}

function imageLine(podYaml: string): string {
  const match = podYaml.match(/^\s*image:\s*(\S+)/m);
  expect(match, 's3manager container image must be set').not.toBeNull();
  return match?.[1] ?? '';
}

interface EnvVar {
  name: string;
  value?: string;
  secretName?: string;
  secretKey?: string;
}

function parseEnvVars(containerYaml: string): EnvVar[] {
  const envBlock = yamlBlock(containerYaml, 'env');
  expect(envBlock, 'Deployment must declare container env').toBeDefined();
  return (envBlock ?? '')
    .split(/^\s*- name:/m)
    .slice(1)
    .map((item) => {
      const name = item.match(/^\s*(\S+)/)?.[1] ?? '';
      const valueMatch = item.match(/^\s*value:\s*(?:"([^"]*)"|'([^']*)'|(\S+))/m);
      const secretName = item.match(/secretKeyRef:[\s\S]*?^\s*name:\s*(\S+)/m)?.[1];
      const secretKey = item.match(/secretKeyRef:[\s\S]*?^\s*key:\s*(\S+)/m)?.[1];
      return {
        name,
        value: valueMatch?.[1] ?? valueMatch?.[2] ?? valueMatch?.[3],
        secretName,
        secretKey,
      };
    });
}

function requireEnv(vars: EnvVar[], name: string): EnvVar {
  const found = vars.find((entry) => entry.name === name);
  expect(found, `env ${name} must be present`).toBeDefined();
  return found ?? { name };
}

interface IngressRoute {
  host: string;
  path: string;
  pathType: string;
  service: string;
  port: number;
}

function parseIngressRoutes(document: string): IngressRoute[] {
  const stripped = stripYamlComments(document);
  const hostChunks = stripped.split(/^\s*- host:/m).slice(1);
  const routes: IngressRoute[] = [];
  for (const hostChunk of hostChunks) {
    const host = hostChunk.match(/^\s*(\S+)/)?.[1] ?? '';
    const pathChunks = hostChunk.split(/^\s*- path:/m).slice(1);
    for (const chunk of pathChunks) {
      routes.push({
        host,
        path: chunk.match(/^\s*(\S+)/)?.[1] ?? '',
        pathType: chunk.match(/pathType:\s*(\S+)/)?.[1] ?? '',
        service: chunk.match(/name:\s*(\S+)/)?.[1] ?? '',
        port: Number(chunk.match(/number:\s*(\d+)/)?.[1] ?? Number.NaN),
      });
    }
  }
  return routes;
}

function htpasswdUserLines(secretYaml: string): string[] {
  const stripped = stripYamlComments(secretYaml);
  const block = stripped.match(/users:\s*\|\s*\n((?:[ \t]+.*\n?)*)/);
  if (block) {
    return block[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  const inline = stripped.match(/users:\s*(\S+)/);
  return inline?.[1] ? [inline[1]] : [];
}

function skipQuoted(source: string, start: number, opener: string, allowEscape: boolean): number {
  const contentStart = start + opener.length;
  if (opener.length === 3) {
    const end = source.indexOf(opener, contentStart);
    return end === -1 ? source.length : end + opener.length;
  }
  let i = contentStart;
  while (i < source.length) {
    if (allowEscape && source[i] === '\\' && i + 1 < source.length) {
      i += 2;
      continue;
    }
    if (source[i] === opener) {
      return i + opener.length;
    }
    i += 1;
  }
  return source.length;
}

function skipStringAt(source: string, index: number): number | null {
  if (source.startsWith("'''", index)) {
    return skipQuoted(source, index, "'''", false);
  }
  if (source.startsWith('"""', index)) {
    return skipQuoted(source, index, '"""', false);
  }
  if (source[index] === "'") {
    return skipQuoted(source, index, "'", true);
  }
  if (source[index] === '"') {
    return skipQuoted(source, index, '"', true);
  }
  return null;
}

function stripGroovyComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const stringEnd = skipStringAt(source, i);
    if (stringEnd !== null) {
      out += source.slice(i, stringEnd);
      i = stringEnd;
      continue;
    }
    if (source.startsWith('//', i)) {
      while (i < source.length && source[i] !== '\n') {
        i += 1;
      }
      continue;
    }
    if (source.startsWith('/*', i)) {
      i += 2;
      while (i < source.length && !source.startsWith('*/', i)) {
        if (source[i] === '\n') {
          out += '\n';
        }
        i += 1;
      }
      if (i < source.length) {
        i += 2;
      }
      continue;
    }
    out += source[i];
    i += 1;
  }
  return out;
}

function indexOfMatchingBrace(source: string, openIndex: number): number {
  let depth = 0;
  let i = openIndex;
  while (i < source.length) {
    const stringEnd = skipStringAt(source, i);
    if (stringEnd !== null) {
      i = stringEnd;
      continue;
    }
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
    i += 1;
  }
  return -1;
}

function extractStageBody(stripped: string, stageName: string): string {
  const re = new RegExp(`stage\\(\\s*(['"])${escapeRegex(stageName)}\\1\\s*\\)`);
  const match = re.exec(stripped);
  if (!match) {
    throw new Error(`executable stage('${stageName}') not found`);
  }
  let i = match.index + match[0].length;
  while (i < stripped.length && /\s/.test(stripped[i] ?? '')) {
    i += 1;
  }
  if (stripped[i] !== '{') {
    throw new Error(`stage('${stageName}') has no { body`);
  }
  const end = indexOfMatchingBrace(stripped, i);
  if (end < 0) {
    throw new Error(`stage('${stageName}') has unmatched braces`);
  }
  return stripped.slice(i + 1, end);
}

function listStageNames(stripped: string): string[] {
  const names: string[] = [];
  const re = /stage\(\s*(['"])([^'"]+)\1\s*\)/g;
  let match = re.exec(stripped);
  while (match) {
    names.push(match[2]);
    match = re.exec(stripped);
  }
  return names;
}

function extractShScripts(groovy: string): string[] {
  const scripts: string[] = [];
  const re = /\bsh\s+('''|"""|'|")/g;
  let match = re.exec(groovy);
  while (match) {
    const opener = match[1];
    const contentStart = match.index + match[0].length;
    if (opener === "'''" || opener === '"""') {
      const end = groovy.indexOf(opener, contentStart);
      scripts.push(groovy.slice(contentStart, end === -1 ? groovy.length : end));
      re.lastIndex = end === -1 ? groovy.length : end + opener.length;
    } else {
      let i = contentStart;
      while (i < groovy.length) {
        if (groovy[i] === '\\' && i + 1 < groovy.length) {
          i += 2;
          continue;
        }
        if (groovy[i] === opener) {
          break;
        }
        i += 1;
      }
      scripts.push(groovy.slice(contentStart, i));
      re.lastIndex = i < groovy.length ? i + 1 : groovy.length;
    }
    match = re.exec(groovy);
  }
  return scripts;
}

function kubectlApplyTargets(shell: string): string[] {
  const folded = shell.replace(/\\\s*\n/g, ' ');
  const targets: string[] = [];
  const applyChunks = folded.split(/\bkubectl\s+apply\b/).slice(1);
  for (const chunk of applyChunks) {
    const command = chunk.split(/[;&\n|]/)[0] ?? '';
    for (const flag of command.matchAll(/-f\s+(\S+)/g)) {
      targets.push(flag[1].replace(/^['"]|['"]$/g, ''));
    }
  }
  return targets;
}

function normalizeK8sTarget(target: string): string {
  return target.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

function hasUnimplementedError(groovy: string): boolean {
  return /error\s*\(?\s*['"]unimplemented['"]/.test(groovy);
}

describe('s3manager public seams (architect constants)', () => {
  it('exports the OpenSpec names, paths, host, port, credential id, and bootstrap stage', () => {
    expect(S3MANAGER_NAMESPACE).toBe('platformer');
    expect(S3MANAGER_DEPLOYMENT_FILE).toBe('k8s/minio/s3manager-deploy.yaml');
    expect(S3MANAGER_DEPLOYMENT_NAME).toBe('platformer-s3manager');
    expect(S3MANAGER_SERVICE_FILE).toBe('k8s/minio/s3manager-svc.yaml');
    expect(S3MANAGER_SERVICE_NAME).toBe('platformer-s3manager');
    expect(S3MANAGER_UI_PORT).toBe(8080);
    expect(S3MANAGER_AUTH_SECRET_EXAMPLE_FILE).toBe(
      'k8s/minio/s3manager-auth-secret.yaml.example',
    );
    expect(S3MANAGER_AUTH_SECRET_NAME).toBe('platformer-s3manager-auth');
    expect(S3MANAGER_MIDDLEWARE_FILE).toBe('k8s/minio/s3manager-middleware.yaml');
    expect(S3MANAGER_MIDDLEWARE_NAME).toBe('platformer-s3manager-auth');
    expect(S3MANAGER_INGRESS_FILE).toBe('k8s/minio/s3manager-ingress.yaml');
    expect(S3MANAGER_INGRESS_NAME).toBe('platformer-s3manager');
    expect(S3MANAGER_INGRESS_HOST).toBe('minio-adminer.balashov-maxim.ru');
    expect(S3MANAGER_JENKINS_CREDENTIAL_ID).toBe('s3manager-http');
    expect(S3MANAGER_BOOTSTRAP_STAGE).toBe('s3manager');
  });
});

describe('1.1 Deployment platformer-s3manager', () => {
  const deploy = findKind(S3MANAGER_DEPLOYMENT_FILE, 'Deployment');
  const stripped = stripYamlComments(deploy);

  it('is Deployment platformer-s3manager in namespace platformer', () => {
    expect(yamlKind(deploy)).toBe('Deployment');
    expect(metadataName(deploy)).toBe(S3MANAGER_DEPLOYMENT_NAME);
    expect(metadataNamespace(deploy)).toBe(S3MANAGER_NAMESPACE);
  });

  it('pins cloudlena/s3manager to a released semver tag, not unimplemented or latest', () => {
    const image = imageLine(stripped);

    expect(image).not.toMatch(/unimplemented/i);
    expect(image).not.toMatch(/:latest$/);
    expect(image).toMatch(RELEASED_S3MANAGER_IMAGE);
  });

  it('exposes the UI containerPort and sets CPU/memory requests and limits', () => {
    expect(stripped).toMatch(new RegExp(`containerPort:\\s*${S3MANAGER_UI_PORT}\\b`));

    const resources = yamlBlock(stripped, 'resources');
    expect(resources, 'container resources must be present').toBeDefined();
    const requests = yamlBlock(resources ?? '', 'requests') ?? '';
    const limits = yamlBlock(resources ?? '', 'limits') ?? '';
    expect(requests).toMatch(/cpu:/);
    expect(requests).toMatch(/memory:/);
    expect(limits).toMatch(/cpu:/);
    expect(limits).toMatch(/memory:/);
  });
});

describe('1.2 S3 env from Secret platformer-minio', () => {
  const deploy = findKind(S3MANAGER_DEPLOYMENT_FILE, 'Deployment');
  const env = parseEnvVars(stripYamlComments(deploy));

  it('sets ENDPOINT to in-cluster platformer-minio:9000 without scheme, public host, or :9001', () => {
    const endpoint = requireEnv(env, 'ENDPOINT');

    expect(endpoint.value).not.toMatch(/unimplemented/i);
    expect(endpoint.value).not.toMatch(/^[a-z]+:\/\//i);
    expect(endpoint.value).not.toMatch(/balashov-maxim\.ru/);
    expect(endpoint.value).not.toMatch(/:9001\b/);
    expect(endpoint.value).toBe(MINIO_S3_ENDPOINT);
  });

  it('disables TLS with USE_SSL=false, not the unimplemented stub', () => {
    const useSsl = requireEnv(env, 'USE_SSL');

    expect(useSsl.value).not.toMatch(/unimplemented/i);
    expect(useSsl.value?.toLowerCase()).toBe('false');
  });

  it('wires ACCESS_KEY_ID and SECRET_ACCESS_KEY via secretKeyRef, not literal unimplemented', () => {
    const access = requireEnv(env, 'ACCESS_KEY_ID');
    const secret = requireEnv(env, 'SECRET_ACCESS_KEY');

    expect(access.value, 'ACCESS_KEY_ID must not be a literal env value').toBeUndefined();
    expect(secret.value, 'SECRET_ACCESS_KEY must not be a literal env value').toBeUndefined();
    expect(access.secretName).toBe(MINIO_SECRET_NAME);
    expect(access.secretKey).toBe('MINIO_ROOT_USER');
    expect(secret.secretName).toBe(MINIO_SECRET_NAME);
    expect(secret.secretKey).toBe('MINIO_ROOT_PASSWORD');
  });

  it('pins BUCKET_NAME to platformer-assets instead of unimplemented', () => {
    const bucket = requireEnv(env, 'BUCKET_NAME');

    expect(bucket.value).not.toMatch(/unimplemented/i);
    expect(bucket.value).toBe('platformer-assets');
  });
});

describe('1.3 ClusterIP Service platformer-s3manager', () => {
  it('targets the UI port and does not expose MinIO console :9001', () => {
    const svc = findKind(S3MANAGER_SERVICE_FILE, 'Service');
    const stripped = stripYamlComments(svc);
    const ports = yamlBlock(stripped, 'ports') ?? '';

    expect(metadataName(svc)).toBe(S3MANAGER_SERVICE_NAME);
    expect(metadataNamespace(svc)).toBe(S3MANAGER_NAMESPACE);
    expect(stripped).toMatch(/type:\s*ClusterIP/);
    expect(ports).toMatch(new RegExp(`port:\\s*${S3MANAGER_UI_PORT}\\b`));
    expect(ports).toMatch(new RegExp(`targetPort:\\s*${S3MANAGER_UI_PORT}\\b`));
    expect(stripped).not.toMatch(/port:\s*9001/);
    expect(stripped).not.toMatch(/targetPort:\s*9001/);
  });
});

describe('1.4 example BasicAuth Secret', () => {
  const raw = readRepoFile(S3MANAGER_AUTH_SECRET_EXAMPLE_FILE);
  const secret = findKind(S3MANAGER_AUTH_SECRET_EXAMPLE_FILE, 'Secret');
  const stripped = stripYamlComments(secret);

  it('is a placeholder Secret with htpasswd key users only', () => {
    expect(metadataName(secret)).toBe(S3MANAGER_AUTH_SECRET_NAME);
    expect(metadataNamespace(secret)).toBe(S3MANAGER_NAMESPACE);
    expect(stripped).toMatch(/^\s*users:/m);
    expect(stripped).not.toMatch(LIVE_HTPASSWD);

    const userLines = htpasswdUserLines(secret);
    expect(userLines.length).toBeGreaterThan(0);
    for (const line of userLines) {
      const [user, pass] = line.split(':');
      expect(user, `${S3MANAGER_AUTH_SECRET_EXAMPLE_FILE} user must be a placeholder`).toMatch(
        PLACEHOLDER_SECRET,
      );
      expect(pass, `${S3MANAGER_AUTH_SECRET_EXAMPLE_FILE} password must be a placeholder`).toMatch(
        PLACEHOLDER_SECRET,
      );
    }
  });

  it('documents that the live Secret is created from Jenkins and is not committed', () => {
    expect(raw).toMatch(/Jenkins/);
    expect(raw).toMatch(/not committed/i);
    expect(raw).toMatch(new RegExp(escapeRegex(S3MANAGER_JENKINS_CREDENTIAL_ID)));
    expect(
      fs.existsSync(path.join(repoRoot, 'k8s/minio/s3manager-auth-secret.yaml')),
      'live s3manager-auth-secret.yaml must not be committed',
    ).toBe(false);
  });
});

describe('2.1 Traefik BasicAuth Middleware', () => {
  it('is traefik.io/v1alpha1 basicAuth pointing at Secret platformer-s3manager-auth', () => {
    const middleware = findKind(S3MANAGER_MIDDLEWARE_FILE, 'Middleware');
    const stripped = stripYamlComments(middleware);
    const apiVersion = stripped.match(/^apiVersion:\s*(\S+)/m)?.[1];

    expect(metadataName(middleware)).toBe(S3MANAGER_MIDDLEWARE_NAME);
    expect(metadataNamespace(middleware)).toBe(S3MANAGER_NAMESPACE);
    expect(apiVersion).toBe('traefik.io/v1alpha1');
    expect(stripped).toMatch(/basicAuth:/);
    expect(stripped).toMatch(new RegExp(`secret:\\s*${escapeRegex(S3MANAGER_AUTH_SECRET_NAME)}`));
  });
});

describe('2.2 Ingress minio-adminer.balashov-maxim.ru', () => {
  const ingress = findKind(S3MANAGER_INGRESS_FILE, 'Ingress');
  const stripped = stripYamlComments(ingress);

  it('routes host path / to the s3manager Service with certresolver le and BasicAuth middleware', () => {
    expect(metadataName(ingress)).toBe(S3MANAGER_INGRESS_NAME);
    expect(metadataNamespace(ingress)).toBe(S3MANAGER_NAMESPACE);
    expect(stripped).toMatch(/certresolver:\s*le/);
    expect(stripped).toMatch(new RegExp(escapeRegex(S3MANAGER_MIDDLEWARE_NAME)));

    const routes = parseIngressRoutes(ingress);
    const root = routes.find((route) => route.host === S3MANAGER_INGRESS_HOST && route.path === '/');
    expect(root, `Ingress must route ${S3MANAGER_INGRESS_HOST} path /`).toBeDefined();
    expect(root?.pathType).toBe('Prefix');
    expect(root?.service).toBe(S3MANAGER_SERVICE_NAME);
    expect(root?.service).not.toBe('platformer-frontend');
    expect(root?.port).toBe(S3MANAGER_UI_PORT);
    expect(root?.port).not.toBe(9001);
  });

  it('uses a TLS secret distinct from the game host certificate', () => {
    const tls = yamlBlock(stripped, 'tls') ?? stripped;
    const secretName = tls.match(/secretName:\s*(\S+)/)?.[1];

    expect(secretName, 's3manager Ingress must declare tls.secretName').toBeDefined();
    expect(secretName).not.toBe(GAME_TLS_SECRET);
    expect(tls).toMatch(new RegExp(`hosts:[\\s\\S]*${escapeRegex(S3MANAGER_INGRESS_HOST)}`));
  });
});

describe('2.3 game host is unchanged and console :9001 stays private', () => {
  const gameIngress = readRepoFile(GAME_INGRESS_FILE);
  const adminIngress = readRepoFile(S3MANAGER_INGRESS_FILE);
  const gameRoutes = yamlDocuments(gameIngress)
    .filter((doc) => yamlKind(doc) === 'Ingress')
    .flatMap((doc) => parseIngressRoutes(doc));
  const adminRoutes = parseIngressRoutes(findKind(S3MANAGER_INGRESS_FILE, 'Ingress'));

  it('does not add an s3manager path on platformer.balashov-maxim.ru', () => {
    for (const route of gameRoutes) {
      expect(route.host).toBe(GAME_HOST);
      expect(route.service).not.toBe(S3MANAGER_SERVICE_NAME);
      expect(route.service).not.toBe(S3MANAGER_DEPLOYMENT_NAME);
    }
    expect(stripYamlComments(gameIngress)).not.toMatch(/s3manager/);
    expect(stripYamlComments(gameIngress)).not.toMatch(
      new RegExp(escapeRegex(S3MANAGER_INGRESS_HOST)),
    );
  });

  it('does not expose MinIO console port 9001 as an Ingress backend', () => {
    for (const route of [...gameRoutes, ...adminRoutes]) {
      expect(route.port, `${route.host}${route.path} must not route to :9001`).not.toBe(9001);
    }
    expect(stripYamlComments(gameIngress)).not.toMatch(/port:\s*9001/);
    expect(stripYamlComments(adminIngress)).not.toMatch(/port:\s*9001/);
    expect(stripYamlComments(adminIngress)).not.toMatch(/targetPort:\s*9001/);
  });
});

describe('3.1 Jenkins credential s3manager-http', () => {
  const example = readRepoFile(S3MANAGER_AUTH_SECRET_EXAMPLE_FILE);
  const deploymentDocs = readRepoFile('docs/DEPLOYMENT.md');
  const bootstrapExec = stripGroovyComments(readRepoFile('Jenkinsfile.bootstrap'));
  const stageBody = extractStageBody(bootstrapExec, S3MANAGER_BOOTSTRAP_STAGE);

  it('documents credential id s3manager-http and keeps the password out of git', () => {
    expect(example).toMatch(new RegExp(escapeRegex(S3MANAGER_JENKINS_CREDENTIAL_ID)));
    expect(deploymentDocs).toMatch(new RegExp(escapeRegex(S3MANAGER_JENKINS_CREDENTIAL_ID)));
    expect(stageBody).toMatch(/withCredentials/);
    expect(stageBody).toMatch(/usernamePassword/);
    expect(stageBody).toMatch(
      new RegExp(`credentialsId:\\s*['"]${escapeRegex(S3MANAGER_JENKINS_CREDENTIAL_ID)}['"]`),
    );
    expect(stageBody).not.toMatch(LIVE_HTPASSWD);
    expect(example).not.toMatch(LIVE_HTPASSWD);
  });
});

describe('3.2 Jenkinsfile.bootstrap stage s3manager after MinIO Init', () => {
  const bootstrapExec = stripGroovyComments(readRepoFile('Jenkinsfile.bootstrap'));
  const body = extractStageBody(bootstrapExec, S3MANAGER_BOOTSTRAP_STAGE);
  const shell = extractShScripts(body).join('\n');

  it('places executable stage s3manager immediately after MinIO Init', () => {
    const names = listStageNames(bootstrapExec);
    const initIndex = names.indexOf(STAGE_MINIO_INIT);
    const s3Index = names.indexOf(S3MANAGER_BOOTSTRAP_STAGE);

    expect(initIndex, `stage('${STAGE_MINIO_INIT}') must exist`).toBeGreaterThanOrEqual(0);
    expect(s3Index, `stage('${S3MANAGER_BOOTSTRAP_STAGE}') must exist`).toBeGreaterThanOrEqual(0);
    expect(s3Index, `stage('${S3MANAGER_BOOTSTRAP_STAGE}') must run after MinIO Init`).toBe(
      initIndex + 1,
    );
  });

  it('creates the BasicAuth Secret via dry-run apply and waits Ready — not error unimplemented', () => {
    expect(
      hasUnimplementedError(body),
      `stage('${S3MANAGER_BOOTSTRAP_STAGE}') body must not be error 'unimplemented'`,
    ).toBe(false);
    expect(body).toMatch(/withKubeConfig/);
    expect(body).toMatch(/\bsh\b/);
    expect(shell).toMatch(/kubectl\s+create\s+secret\b/);
    expect(shell).toMatch(new RegExp(escapeRegex(S3MANAGER_AUTH_SECRET_NAME)));
    expect(shell).toMatch(/--dry-run=client/);
    expect(shell).toMatch(/-o\s+yaml/);
    expect(shell).toMatch(/kubectl\s+apply\b/);
    expect(shell).toMatch(/apply\s+-f\s+-/);
    expect(shell).toMatch(
      new RegExp(
        `rollout\\s+status\\s+deployment/${escapeRegex(S3MANAGER_DEPLOYMENT_NAME)}|--for=condition=ready`,
      ),
    );
  });

  it('applies individual s3manager yaml files and never the minio directory or secret.yaml.example', () => {
    expect(hasUnimplementedError(body)).toBe(false);

    const targets = kubectlApplyTargets(shell).map(normalizeK8sTarget);
    for (const file of [
      S3MANAGER_DEPLOYMENT_FILE,
      S3MANAGER_SERVICE_FILE,
      S3MANAGER_MIDDLEWARE_FILE,
      S3MANAGER_INGRESS_FILE,
    ]) {
      expect(targets, `must kubectl apply -f ${file}`).toContain(file);
    }
    expect(targets.some((target) => target === 'k8s/minio')).toBe(false);
    expect(targets.some((target) => target.includes('secret.yaml.example'))).toBe(false);
    expect(targets).not.toContain(S3MANAGER_AUTH_SECRET_EXAMPLE_FILE);
  });
});

describe('3.3 game Jenkinsfile does not build or push s3manager', () => {
  it('keeps the game image pipeline free of s3manager build/push', () => {
    const jenkinsExec = stripGroovyComments(readRepoFile('Jenkinsfile'));

    expect(jenkinsExec).not.toMatch(/cloudlena\/s3manager/);
    expect(jenkinsExec).not.toMatch(/s3manager/i);
    expect(jenkinsExec).not.toMatch(new RegExp(escapeRegex(S3MANAGER_DEPLOYMENT_FILE)));
    expect(jenkinsExec).not.toMatch(new RegExp(escapeRegex(S3MANAGER_INGRESS_HOST)));
  });
});

describe('4.1 docs/DEPLOYMENT.md DNS for the admin host', () => {
  const docs = readRepoFile('docs/DEPLOYMENT.md');

  it('gives real A/CNAME operator steps for minio-adminer, not an UNIMPLEMENTED leftover', () => {
    assertNoStubStatus(docs, 'docs/DEPLOYMENT.md');
    expect(docs).toMatch(new RegExp(escapeRegex(S3MANAGER_INGRESS_HOST)));
    expect(docs).toMatch(/A\s*\/?\s*CNAME|A or CNAME|CNAME/i);
    expect(docs).toMatch(
      new RegExp(`(?:dig|nslookup)\\s+${escapeRegex(S3MANAGER_INGRESS_HOST)}`),
    );
  });
});

describe('4.2 MINIO-ASSETS.md and README operator path', () => {
  const minioDocs = readRepoFile('docs/MINIO-ASSETS.md');
  const readme = readRepoFile('README.md');

  it('describes browser UI upload, assets/ = public/assets/, CLI push, and --no-verify without UNIMPLEMENTED status', () => {
    assertNoStubStatus(minioDocs, 'docs/MINIO-ASSETS.md');
    assertNoStubStatus(readme, 'README.md');

    for (const source of [minioDocs, readme]) {
      expect(source).toMatch(new RegExp(`https://${escapeRegex(S3MANAGER_INGRESS_HOST)}`));
      expect(source).toMatch(/assets\//);
      expect(source).toMatch(/public\/assets\//);
      expect(source).toMatch(/assets:push/);
      expect(source).toMatch(/git push --no-verify/);
    }
  });
});

describe('4.3 BasicAuth is not MinIO root by default', () => {
  it('documents HTTP login ≠ MinIO root unless the operator chooses the same password', () => {
    const docs = readRepoFile('docs/DEPLOYMENT.md');
    const minioDocs = readRepoFile('docs/MINIO-ASSETS.md');
    const readme = readRepoFile('README.md');

    assertNoStubStatus(docs, 'docs/DEPLOYMENT.md §4.3');
    for (const source of [docs, minioDocs, readme]) {
      expect(source).toMatch(/BasicAuth|HTTP login|HTTP Basic/i);
      expect(source).toMatch(/MinIO root/i);
    }
  });
});

describe('5.1–5.3 documented verify contracts (no live cluster curl)', () => {
  const docs = readRepoFile('docs/DEPLOYMENT.md');
  const minioDocs = readRepoFile('docs/MINIO-ASSETS.md');
  const combined = `${docs}\n${minioDocs}`;

  it('records unauthenticated 401 for https://minio-adminer.balashov-maxim.ru/ in operator docs', () => {
    assertNoStubStatus(docs, 'docs/DEPLOYMENT.md verify');
    expect(combined).toMatch(
      new RegExp(`curl\\s+-sI\\s+https://${escapeRegex(S3MANAGER_INGRESS_HOST)}/`),
    );
    expect(combined).toMatch(/401/);
  });

  it('records authenticated 200 s3manager UI, not frontend index.html', () => {
    assertNoStubStatus(docs, 'docs/DEPLOYMENT.md verify 200');
    expect(combined).toMatch(/curl\s+-sI\s+-u/);
    expect(combined).toMatch(/200/);
    expect(combined).toMatch(/s3manager UI/i);
    expect(combined).toMatch(/index\.html/);
    expect(combined).toMatch(/not frontend|NOT frontend|not index\.html/i);
  });

  it('records upload under assets/ as platformer-assets/assets/<relative-path>', () => {
    assertNoStubStatus(minioDocs, 'docs/MINIO-ASSETS.md upload contract');
    expect(combined).toMatch(/platformer-assets\/assets\//);
    expect(combined).toMatch(/public\/assets\//);
    expect(combined).toMatch(/relative-path|relative path|same relative/i);
  });
});
