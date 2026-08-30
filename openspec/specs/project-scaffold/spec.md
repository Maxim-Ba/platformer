# project-scaffold

## Purpose

Bootstrap репозитория: Vite + TypeScript + Phaser 3, layout ассетов, tooling и README для локального запуска.

## Requirements

### Requirement: Vite and TypeScript bootstrap

The project MUST provide a Vite-based TypeScript build with development server and production build commands.

#### Scenario: Development server starts

- **WHEN** developer runs the documented dev command
- **THEN** a local server MUST serve the game and support hot reload for source changes

#### Scenario: Production build succeeds

- **WHEN** developer runs the documented build command
- **THEN** static assets MUST be emitted to a distributable output directory without TypeScript errors

### Requirement: Phaser 3 integration

The project MUST initialize Phaser 3 with arcade physics enabled and documented base game configuration.

#### Scenario: Game canvas renders

- **WHEN** the application loads in browser
- **THEN** a Phaser game instance MUST mount to the DOM canvas element without runtime errors

#### Scenario: Pixel art rendering defaults

- **WHEN** game config is applied
- **THEN** `pixelArt: true` and a base resolution of 1920×1080 (Full HD) with FIT scale mode MUST be configured

### Requirement: Asset pipeline layout

Static game assets MUST reside under `public/assets/` on the developer machine and CI workspace, with subdirectories for maps, images, and audio. Those runtime files MUST NOT be required to live in git; they MUST be obtained via documented pull from object storage or a local working copy.

#### Scenario: Asset loading path convention

- **WHEN** PreloadScene loads assets
- **THEN** paths MUST stay relative to the `assets/` prefix using documented keys from the `assetKeys` module, composed with the configured asset base URL

#### Scenario: Runtime files are not source-of-truth in git

- **WHEN** a developer inspects a fresh clone without running `assets:pull`
- **THEN** `public/assets/` MUST NOT be required to contain sprites, tilesets, or map JSON blobs in version control

### Requirement: Developer tooling baseline

The project MUST include ESLint and Prettier configuration suitable for TypeScript game code.

#### Scenario: Lint command exists

- **WHEN** developer runs the documented lint command
- **THEN** TypeScript sources MUST be linted with zero errors on a clean foundation scaffold

### Requirement: README bootstrap documentation

The repository MUST include a README describing prerequisites, install, asset pull, dev, build, and project structure overview.

#### Scenario: New contributor onboarding

- **WHEN** a developer clones the repository
- **THEN** README instructions MUST be sufficient to obtain runtime assets and run the game locally without undisclosed steps

### Requirement: Configurable runtime asset base URL

The game MUST resolve Phaser and Tiled loader paths against a configurable asset base URL so production can load files from MinIO while local Vite continues to serve `public/`.

#### Scenario: Production loads from media prefix

- **WHEN** the production bundle is built with `VITE_ASSET_BASE_URL=/media/`
- **THEN** PreloadScene and GameScene MUST request foundation images, tilesets, and map JSON under the `/media/` prefix (for example `/media/assets/images/player-sheet.png`)

#### Scenario: Local dev loads from Vite public dir

- **WHEN** a developer runs `npm run dev` with an empty asset base URL and `public/assets/` populated
- **THEN** PreloadScene MUST load the same relative keys from `/assets/...` without requiring MinIO
