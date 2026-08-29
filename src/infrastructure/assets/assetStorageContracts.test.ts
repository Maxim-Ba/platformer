import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ASSET_GITKEEP_DIRECTORIES, CANONICAL_RUNTIME_MAP_URL } from './index';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8').replaceAll('\r\n', '\n');
}

function dropFullLineComments(source: string, commentPrefix: string): string {
  return source
    .split('\n')
    .filter((line) => !line.trim().startsWith(commentPrefix))
    .join('\n');
}

describe('npm assets:push / assets:pull (task 3.1)', () => {
  it('wraps assets-sync between public/assets/ and platformer-assets/assets', () => {
    const pkg = JSON.parse(readRepoFile('package.json')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['assets:push']).toMatch(/assets-sync\.mjs\s+push/);
    expect(pkg.scripts?.['assets:pull']).toMatch(/assets-sync\.mjs\s+pull/);

    const wrapper = readRepoFile('scripts/assets-sync.mjs');
    expect(wrapper).toMatch(/s3manager/);
    expect(wrapper).toMatch(/platformer-assets\/assets/);
    expect(wrapper).toMatch(/public\/assets/);
  });
});

describe('gitignore runtime blobs (task 3.2)', () => {
  it('ignores png, svg, json maps, and audio under public/assets while keeping .gitkeep', () => {
    const gitignore = readRepoFile('.gitignore');
    expect(gitignore).toMatch(/public\/assets\/\*\*\/\*\.png/);
    expect(gitignore).toMatch(/public\/assets\/\*\*\/\*\.svg/);
    expect(gitignore).toMatch(/public\/assets\/\*\*\/\*\.json/);
    expect(gitignore).toMatch(/public\/assets\/\*\*\/\*\.ogg/);
    expect(gitignore).toMatch(/public\/assets\/\*\*\/\*\.mp3/);
    expect(gitignore).toMatch(/public\/assets\/\*\*\/\*\.wav/);
    expect(gitignore).toMatch(/!public\/assets\/\*\*\/\.gitkeep/);
    expect(gitignore).toMatch(/tiled\//);
    expect(gitignore).not.toMatch(/^tiled\/?\s*$/m);

    for (const dir of ASSET_GITKEEP_DIRECTORIES) {
      const gitkeep = path.join(repoRoot, dir, '.gitkeep');
      expect(fs.existsSync(gitkeep), `${dir}/.gitkeep`).toBe(true);
    }
  });
});

describe('pre-push hook (task 3.3)', () => {
  it('runs assets:push and documents git config core.hooksPath', () => {
    const hook = readRepoFile('scripts/git-hooks/pre-push');
    expect(hook.startsWith('#!')).toBe(true);
    expect(dropFullLineComments(hook, '#')).toMatch(/npm run assets:push/);
    expect(hook).toMatch(/git config core\.hooksPath scripts\/git-hooks/);
  });
});

describe('.env.example (task 3.4)', () => {
  it('documents s3manager BasicAuth and MinIO pull env vars without real secrets', () => {
    const envExample = readRepoFile('.env.example');
    expect(envExample).toMatch(/^S3MANAGER_URL=https:\/\/minio-adminer\.balashov-maxim\.ru\s*$/m);
    expect(envExample).toMatch(/^S3MANAGER_USER=\s*$/m);
    expect(envExample).toMatch(/^S3MANAGER_PASSWORD=\s*$/m);
    expect(envExample).toMatch(/^MINIO_ENDPOINT=\s*$/m);
    expect(envExample).toMatch(/^MINIO_ACCESS_KEY=\s*$/m);
    expect(envExample).toMatch(/^MINIO_SECRET_KEY=\s*$/m);
    expect(envExample).not.toMatch(/MINIO_(ACCESS_KEY|SECRET_KEY|PASS)=.{8,}/);
    expect(envExample).not.toMatch(/^S3MANAGER_PASSWORD=.+$/m);
    expect(envExample.toLowerCase()).not.toMatch(/minioadmin/);
  });
});

describe('.env.production Docker build (task 4.5)', () => {
  it('sets VITE_ASSET_BASE_URL=/media/ and copies it into the image build', () => {
    const envProduction = readRepoFile('.env.production');
    expect(envProduction).toMatch(/^VITE_ASSET_BASE_URL=\/media\/\s*$/m);

    const dockerignore = readRepoFile('.dockerignore');
    expect(dockerignore).toMatch(/^\.env\.\*$/m);
    expect(dockerignore).toMatch(/^!\.env\.production\s*$/m);

    const dockerfile = dropFullLineComments(readRepoFile('Dockerfile'), '#');
    expect(dockerfile).toMatch(/COPY\s+\.env\.production\s+\.env\.production/);
    expect(dockerfile).toMatch(/npm run build/);
  });
});

describe('Dockerfile strip after vite build (task 5.1)', () => {
  it('removes maps/images/sprite/tilesets/audio from dist after npm run build', () => {
    const dockerfile = dropFullLineComments(readRepoFile('Dockerfile'), '#');
    const buildStage = dockerfile.split(/FROM\s+nginx/)[0] ?? dockerfile;
    expect(buildStage).toMatch(/npm run build/);

    const afterBuild = buildStage.slice(buildStage.search(/npm run build/));
    const stripsViaHelper = /stripRuntimeAssetsFromDist/.test(afterBuild);
    const stripsViaRm = ['maps', 'images', 'sprite', 'tilesets', 'audio'].every((dir) =>
      new RegExp(String.raw`rm\b[\s\S]{0,400}\b${dir}\b`).test(afterBuild),
    );
    expect(
      stripsViaHelper || stripsViaRm,
      'Dockerfile must delete runtime dirs after vite build (not only a comment)',
    ).toBe(true);
  });
});

describe('nginx SPA without packing maps (task 5.2)', () => {
  it('serves / and hashed /assets/index-*.js; canonical map URL is MinIO /media/', () => {
    const nginx = readRepoFile('nginx.conf');
    expect(nginx).toMatch(/listen\s+80/);
    expect(nginx).toMatch(/try_files \$uri \$uri\/ \/index\.html/);
    expect(nginx).toMatch(/location \/assets\//);
    expect(nginx).toMatch(/index-\*\.js/);
    expect(CANONICAL_RUNTIME_MAP_URL).toBe('/media/assets/maps/level-01.json');

    const dockerfile = dropFullLineComments(readRepoFile('Dockerfile'), '#');
    expect(dockerfile).toMatch(/COPY --from=build \/app\/dist \/usr\/share\/nginx\/html/);
    expect(dockerfile).not.toMatch(/COPY\s+public\/assets/);
  });
});

describe('docs/DEPLOYMENT.md (tasks 7.1, 7.3–7.6)', () => {
  it('has non-STUB operator architecture, bootstrap, credentials, and verify curls', () => {
    const deployment = readRepoFile('docs/DEPLOYMENT.md');
    expect(deployment).not.toMatch(/\bSTUB\b/);
    expect(deployment).toMatch(/MinIO/);
    expect(deployment).toMatch(/platformer-assets/);
    expect(deployment).toMatch(/Secret/);
    expect(deployment).toMatch(/\bJob\b/);
    expect(deployment).toMatch(/minio-assets/);
    expect(deployment).toMatch(/curl -sfI https:\/\/platformer\.balashov-maxim\.ru\/?\s/);
    expect(deployment).toMatch(
      /curl -sfI https:\/\/platformer\.balashov-maxim\.ru\/media\/assets\/maps\/level-01\.json/,
    );
  });

  it('documents one-time seed via s3manager UI or assets:push, not laptop mc to :9000', () => {
    const deployment = readRepoFile('docs/DEPLOYMENT.md');
    expect(deployment).not.toMatch(/\bSTUB\b/);
    expect(deployment).toMatch(/assets:push/);
    expect(deployment).toMatch(/minio-adminer\.balashov-maxim\.ru/);
    expect(deployment).toMatch(/public\/assets/);
    expect(deployment).toMatch(/platformer-assets/);
  });

  it('documents git rm --cached after /media playtest without rewriting history', () => {
    const deployment = readRepoFile('docs/DEPLOYMENT.md');
    expect(deployment).not.toMatch(/\bSTUB\b/);
    expect(deployment).toMatch(/git rm --cached/);
    expect(deployment).toMatch(/\.gitkeep/);
    expect(deployment.toLowerCase()).toMatch(/do not rewrite history|не переписыв/);
  });

  it('documents local verify: assets:pull, validate:maps, npm test, npm run build', () => {
    const deployment = readRepoFile('docs/DEPLOYMENT.md');
    expect(deployment).not.toMatch(/\bSTUB\b/);
    expect(deployment).toMatch(/assets:pull/);
    expect(deployment).toMatch(/validate:maps/);
    expect(deployment).toMatch(/npm test/);
    expect(deployment).toMatch(/npm run build/);
  });

  it('documents cluster verify: MinIO Ready, curl -sfI on /media/, browser loads from MinIO', () => {
    const deployment = readRepoFile('docs/DEPLOYMENT.md');
    expect(deployment).not.toMatch(/\bSTUB\b/);
    expect(deployment).toMatch(/MinIO Ready|Ready/);
    expect(deployment).toMatch(/curl -sfI/);
    expect(deployment).toMatch(/\/media\/assets\/maps\/level-01\.json/);
    expect(deployment.toLowerCase()).toMatch(/browser|браузер/);
  });
});

describe('README onboarding (task 7.2)', () => {
  it('documents clone → assets:pull → npm run dev, hook setup, and that runtime files are not in git', () => {
    const readme = readRepoFile('README.md');
    expect(readme).not.toMatch(/\bSTUB\b/);
    expect(readme).toMatch(/git clone/);
    expect(readme).toMatch(/assets:pull/);
    expect(readme).toMatch(/npm run dev/);
    expect(readme).toMatch(/git config core\.hooksPath scripts\/git-hooks/);
    expect(readme.toLowerCase()).toMatch(/not in git|не в git|gitignore/);
  });
});
