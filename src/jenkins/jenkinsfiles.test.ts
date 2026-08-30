import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { WORLD_GRAPH } from '../game/world-graph';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const STAGE_MINIO_SECRET = 'MinIO Secret';
const STAGE_MINIO_MANIFESTS = 'MinIO Manifests';
const STAGE_MINIO_READY = 'MinIO Ready';
const STAGE_MINIO_INIT = 'MinIO Init';
const STAGE_PULL_ASSETS = 'Pull Assets';
const STAGE_ASSERT_WORLD_GRAPH_MAPS = 'Assert World Graph Maps';
const STEP_VERIFY_MINIO_MEDIA = 'VerifyMinIOMedia';

const MINIO_YAML_FILES = [
  'k8s/minio/statefulset.yaml',
  'k8s/minio/service.yaml',
  'k8s/minio/job.yaml',
  'k8s/minio/middleware.yaml',
] as const;

const WORLD_GRAPH_MAP_PATHS = Object.keys(WORLD_GRAPH).map(
  (roomId) => `public/assets/maps/${roomId}.json`,
);

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8').replaceAll('\r\n', '\n');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function expectStageOrder(stripped: string, sequence: string[]): void {
  const names = listStageNames(stripped);
  const indexes = sequence.map((name) => names.indexOf(name));
  for (let i = 0; i < sequence.length; i += 1) {
    expect(indexes[i], `stage('${sequence[i]}') must exist`).toBeGreaterThanOrEqual(0);
    if (i > 0) {
      expect(
        indexes[i],
        `stage('${sequence[i]}') must run after stage('${sequence[i - 1]}')`,
      ).toBeGreaterThan(indexes[i - 1]);
    }
  }
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

function stageShell(strippedFile: string, stageName: string): string {
  return extractShScripts(extractStageBody(strippedFile, stageName)).join('\n');
}

function foldShellContinuations(shell: string): string {
  return shell.replace(/\\\s*\n/g, ' ');
}

function kubectlApplyTargets(shell: string): string[] {
  const folded = foldShellContinuations(shell);
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

function isMinioDirectoryApply(target: string): boolean {
  return normalizeK8sTarget(target) === 'k8s/minio';
}

function isExampleSecretApply(target: string): boolean {
  return normalizeK8sTarget(target).includes('secret.yaml.example');
}

function hasUnimplementedError(groovy: string): boolean {
  return /error\s*\(?\s*['"]unimplemented['"]/.test(groovy);
}

function indexOfExecutable(haystack: string, pattern: RegExp, label: string): number {
  const index = haystack.search(pattern);
  expect(
    index,
    `${label} must appear in executable Groovy/sh (comments stripped)`,
  ).toBeGreaterThanOrEqual(0);
  return index;
}

function expectFileExistenceCheck(shell: string, relativePath: string): void {
  expect(shell, `must mention ${relativePath}`).toContain(relativePath);
  const hasTest =
    /\btest\s+-[fe]\b/.test(shell) ||
    /\[\s+-[fe]\s+/.test(shell) ||
    /\[\[\s+-[fe]\s+/.test(shell) ||
    /\bexistsSync\b/.test(shell) ||
    /\bfs\.exists\b/.test(shell);
  expect(
    hasTest,
    `${relativePath} must be asserted with test -f / existsSync, not a comment`,
  ).toBe(true);
}

describe('Jenkinsfiles (slice A: tasks 2.4, 6.1–6.4)', () => {
  const bootstrap = readRepoFile('Jenkinsfile.bootstrap');
  const jenkinsfile = readRepoFile('Jenkinsfile');
  const bootstrapExec = stripGroovyComments(bootstrap);
  const jenkinsExec = stripGroovyComments(jenkinsfile);

  describe('Groovy comment stripping (anti-tautology)', () => {
    it('drops // and /* */ comments but keeps commands inside sh strings', () => {
      const sample = `
        stage('MinIO Secret') {
          // kubectl create secret generic platformer-minio --from-literal=MINIO_ROOT_USER=x
          /* kubectl apply -f k8s/minio/secret.yaml.example */
          error 'unimplemented'
        }
        sh '''
          kubectl apply -f k8s/minio/statefulset.yaml
          curl -sfI https://example.test/media/assets/maps/level-01.json
        '''
      `;
      const stripped = stripGroovyComments(sample);

      expect(stripped).toMatch(/error 'unimplemented'/);
      expect(stripped).not.toMatch(/MINIO_ROOT_USER=x/);
      expect(stripped).not.toMatch(/secret\.yaml\.example/);
      expect(stripped).toMatch(/kubectl apply -f k8s\/minio\/statefulset.yaml/);
      expect(stripped).toMatch(/https:\/\/example\.test\/media\/assets\/maps\/level-01\.json/);
    });
  });

  describe('2.4 Jenkinsfile.bootstrap MinIO after Secrets, before Applications', () => {
    it('places MinIO stages after dockerhub Secrets and before Applications', () => {
      expectStageOrder(bootstrapExec, [
        'Secrets',
        STAGE_MINIO_SECRET,
        STAGE_MINIO_MANIFESTS,
        STAGE_MINIO_READY,
        STAGE_MINIO_INIT,
        'Applications',
      ]);
    });

    describe(STAGE_MINIO_SECRET, () => {
      const body = extractStageBody(bootstrapExec, STAGE_MINIO_SECRET);
      const shell = stageShell(bootstrapExec, STAGE_MINIO_SECRET);

      it('creates live Secret platformer-minio via kubectl create secret + dry-run apply', () => {
        expect(hasUnimplementedError(body), `${STAGE_MINIO_SECRET} must not stay unimplemented`).toBe(
          false,
        );
        expect(body).toMatch(/withKubeConfig/);
        expect(body).toMatch(/withCredentials/);
        expect(body).toMatch(/usernamePassword/);
        expect(body).toMatch(/\bsh\b/);

        expect(shell).toMatch(/kubectl\s+create\s+secret\b/);
        expect(shell).toMatch(/platformer-minio/);
        expect(shell).toMatch(/MINIO_ROOT_USER/);
        expect(shell).toMatch(/MINIO_ROOT_PASSWORD/);
        expect(shell).toMatch(/--dry-run=client/);
        expect(shell).toMatch(/-o\s+yaml/);
        expect(shell).toMatch(/kubectl\s+apply\b/);
        expect(shell).toMatch(/apply\s+-f\s+-/);
        expect(shell).not.toMatch(/docker-registry|dockerhub-secret/);
      });

      it('does not apply k8s/minio/secret.yaml.example', () => {
        const targets = kubectlApplyTargets(shell);
        expect(targets.some(isExampleSecretApply)).toBe(false);
        expect(shell).not.toMatch(/secret\.yaml\.example/);
      });
    });

    describe(STAGE_MINIO_MANIFESTS, () => {
      const body = extractStageBody(bootstrapExec, STAGE_MINIO_MANIFESTS);
      const shell = stageShell(bootstrapExec, STAGE_MINIO_MANIFESTS);

      it('applies individual MinIO files, not the directory that includes the example Secret', () => {
        expect(
          hasUnimplementedError(body),
          `${STAGE_MINIO_MANIFESTS} must not stay unimplemented`,
        ).toBe(false);
        expect(body).toMatch(/withKubeConfig/);
        expect(body).toMatch(/\bsh\b/);

        const targets = kubectlApplyTargets(shell).map(normalizeK8sTarget);
        for (const file of MINIO_YAML_FILES) {
          expect(targets, `must kubectl apply -f ${file}`).toContain(file);
        }
        expect(targets.some(isMinioDirectoryApply), 'must not kubectl apply -f k8s/minio/').toBe(
          false,
        );
        expect(targets.some(isExampleSecretApply)).toBe(false);
      });
    });

    describe(STAGE_MINIO_READY, () => {
      const body = extractStageBody(bootstrapExec, STAGE_MINIO_READY);
      const shell = stageShell(bootstrapExec, STAGE_MINIO_READY);

      it('waits until platformer-minio is Ready via rollout status or wait --for=condition=ready', () => {
        expect(hasUnimplementedError(body), `${STAGE_MINIO_READY} must not stay unimplemented`).toBe(
          false,
        );
        expect(body).toMatch(/withKubeConfig/);
        expect(body).toMatch(/\bsh\b/);
        expect(shell).toMatch(/platformer-minio/);
        expect(shell).toMatch(/rollout\s+status|--for=condition=ready/);
      });
    });

    describe(STAGE_MINIO_INIT, () => {
      const body = extractStageBody(bootstrapExec, STAGE_MINIO_INIT);
      const shell = stageShell(bootstrapExec, STAGE_MINIO_INIT);

      it('deletes and recreates Job platformer-minio-init, then waits for complete', () => {
        expect(hasUnimplementedError(body), `${STAGE_MINIO_INIT} must not stay unimplemented`).toBe(
          false,
        );
        expect(body).toMatch(/withKubeConfig/);
        expect(body).toMatch(/\bsh\b/);
        expect(shell).toMatch(/kubectl\s+delete\b/);
        expect(shell).toMatch(/\bjob\b/);
        expect(shell).toMatch(/platformer-minio-init/);
        expect(shell).toMatch(/kubectl\s+(apply|create)\b/);
        expect(shell).toMatch(/k8s\/minio\/job\.yaml/);
        expect(shell).toMatch(/kubectl\s+wait\b/);
        expect(shell).toMatch(/--for=condition=complete/);
      });
    });

    it('never applies secret.yaml.example or the whole k8s/minio/ directory', () => {
      const targets = kubectlApplyTargets(extractShScripts(bootstrapExec).join('\n'));
      expect(targets.some(isExampleSecretApply)).toBe(false);
      expect(targets.some(isMinioDirectoryApply)).toBe(false);
    });
  });

  describe('6.1–6.4 Jenkinsfile asset pull, world-graph gate, verify, push order', () => {
    describe(STAGE_PULL_ASSETS, () => {
      const body = extractStageBody(jenkinsExec, STAGE_PULL_ASSETS);
      const shell = stageShell(jenkinsExec, STAGE_PULL_ASSETS);

      it('uses withCredentials s3manager-http and docker npm run assets:pull into public/assets/', () => {
        expect(hasUnimplementedError(body), `${STAGE_PULL_ASSETS} must not stay unimplemented`).toBe(
          false,
        );
        expect(body).toMatch(/withCredentials/);
        expect(body).toMatch(/usernamePassword/);
        expect(body).toMatch(/credentialsId:\s*['"]s3manager-http['"]/);
        expect(body).toMatch(/\bsh\b/);
        expect(shell).toMatch(/docker/);
        expect(shell).toMatch(/npm\s+run\s+assets:pull/);
        expect(shell).toMatch(/minio-adminer\.balashov-maxim\.ru|S3MANAGER_URL/);
        expect(shell).toMatch(/public\/assets\//);
        expect(shell).not.toMatch(/\bmc\s+mirror\b/);
        expect(shell).not.toMatch(/^\s*npm\s+run\s+assets:pull\s*$/m);
      });
    });

    describe(STAGE_ASSERT_WORLD_GRAPH_MAPS, () => {
      const body = extractStageBody(jenkinsExec, STAGE_ASSERT_WORLD_GRAPH_MAPS);
      const shell = stageShell(jenkinsExec, STAGE_ASSERT_WORLD_GRAPH_MAPS);

      it('fails the pipeline when WORLD_GRAPH maps are missing after pull', () => {
        expect(
          hasUnimplementedError(body),
          `${STAGE_ASSERT_WORLD_GRAPH_MAPS} must not stay unimplemented`,
        ).toBe(false);
        expect(WORLD_GRAPH_MAP_PATHS.length).toBeGreaterThan(0);
        expect(body).toMatch(/\bsh\b/);
        expect(jenkinsExec).not.toMatch(/import[\s\S]*world-graph|require\([^)]*world-graph/);
        for (const mapPath of WORLD_GRAPH_MAP_PATHS) {
          expectFileExistenceCheck(shell, mapPath);
        }
      });
    });

    it('runs Pull Assets and Assert World Graph Maps before Test docker.build --target build', () => {
      expectStageOrder(jenkinsExec, [
        STAGE_PULL_ASSETS,
        STAGE_ASSERT_WORLD_GRAPH_MAPS,
        'Test',
        'Build',
        'Push',
        'Deploy',
      ]);

      const firstMapPath = WORLD_GRAPH_MAP_PATHS[0];
      expect(firstMapPath).toBeDefined();

      const pullCmd = indexOfExecutable(jenkinsExec, /npm\s+run\s+assets:pull/, 'npm run assets:pull');
      const assertCmd = indexOfExecutable(
        jenkinsExec,
        new RegExp(escapeRegex(firstMapPath ?? '')),
        `WORLD_GRAPH map path ${firstMapPath}`,
      );
      const testImage = indexOfExecutable(
        jenkinsExec,
        /docker\.build\([\s\S]{0,240}--target build/,
        "docker.build(..., '--target build .')",
      );
      const pushCmd = indexOfExecutable(jenkinsExec, /\.push\(\)/, 'image push');
      const deployCmd = indexOfExecutable(
        jenkinsExec,
        /kubectl\s+set\s+image\b/,
        'kubectl set image deploy',
      );

      expect(pullCmd).toBeLessThan(assertCmd);
      expect(assertCmd).toBeLessThan(testImage);
      expect(testImage).toBeLessThan(pushCmd);
      expect(pushCmd).toBeLessThan(deployCmd);
    });

    it('keeps Push and Deploy gated on Test and Build after a successful pull (task 6.4)', () => {
      const testBody = extractStageBody(jenkinsExec, 'Test');
      expect(testBody).toMatch(/docker\.build\(/);
      expect(testBody).toMatch(/--target build/);

      const buildBody = extractStageBody(jenkinsExec, 'Build');
      expect(buildBody).toMatch(/docker\.build\(/);

      const pushBody = extractStageBody(jenkinsExec, 'Push');
      expect(pushBody).toMatch(/docker\.withRegistry/);
      expect(pushBody).toMatch(/\.push\(\)/);

      const deployBody = extractStageBody(jenkinsExec, 'Deploy');
      const deployShell = extractShScripts(deployBody).join('\n');
      expect(deployShell).toMatch(/kubectl apply -f k8s\/minio\/middleware.yaml/);
      expect(deployShell).toMatch(/kubectl apply -f k8s\/ingress\/ingress.yaml/);
      expect(deployShell).toMatch(/kubectl\s+set\s+image\b/);
      expect(deployShell).toMatch(/rollout\s+status/);
    });

    describe(STEP_VERIFY_MINIO_MEDIA, () => {
      const body = extractStageBody(jenkinsExec, 'Verify');
      const shell = extractShScripts(body).join('\n');

      it('curls SITE_URL/ and curl -sfI SITE_URL/media/assets/maps/level-01.json', () => {
        expect(hasUnimplementedError(body), 'VerifyMinIOMedia must not stay unimplemented').toBe(
          false,
        );
        expect(shell).toMatch(/curl\s+-sf\b/);
        expect(shell).toMatch(/\$\{SITE_URL\}\/|\$SITE_URL\//);
        expect(shell).toMatch(/curl\s+-sfI\b/);
        expect(shell).toMatch(
          /\$\{SITE_URL\}\/media\/assets\/maps\/level-01\.json|\$SITE_URL\/media\/assets\/maps\/level-01\.json/,
        );
      });

      it('fails Verify when /media map body is SPA HTML, not only when status is non-200', () => {
        expect(shell).toMatch(/<!doctype html/);
        expect(shell).toMatch(/["']tilesets["']/);
        expect(shell).toMatch(/["']layers["']/);
      });
    });
  });
});
