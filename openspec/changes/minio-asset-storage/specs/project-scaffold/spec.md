## ADDED Requirements

### Requirement: Configurable runtime asset base URL

The game MUST resolve Phaser and Tiled loader paths against a configurable asset base URL so production can load files from MinIO while local Vite continues to serve `public/`.

#### Scenario: Production loads from media prefix

- **WHEN** the production bundle is built with `VITE_ASSET_BASE_URL=/media/`
- **THEN** PreloadScene and GameScene MUST request foundation images, tilesets, and map JSON under the `/media/` prefix (for example `/media/assets/images/player-sheet.png`)

#### Scenario: Local dev loads from Vite public dir

- **WHEN** a developer runs `npm run dev` with an empty asset base URL and `public/assets/` populated
- **THEN** PreloadScene MUST load the same relative keys from `/assets/...` without requiring MinIO

## MODIFIED Requirements

### Requirement: Asset pipeline layout

Static game assets MUST reside under `public/assets/` on the developer machine and CI workspace, with subdirectories for maps, images, and audio. Those runtime files MUST NOT be required to live in git; they MUST be obtained via documented pull from object storage or a local working copy.

#### Scenario: Asset loading path convention

- **WHEN** PreloadScene loads assets
- **THEN** paths MUST stay relative to the `assets/` prefix using documented keys from the `assetKeys` module, composed with the configured asset base URL

#### Scenario: Runtime files are not source-of-truth in git

- **WHEN** a developer inspects a fresh clone without running `assets:pull`
- **THEN** `public/assets/` MUST NOT be required to contain sprites, tilesets, or map JSON blobs in version control

### Requirement: README bootstrap documentation

The repository MUST include a README describing prerequisites, install, asset pull, dev, build, and project structure overview.

#### Scenario: New contributor onboarding

- **WHEN** a developer clones the repository
- **THEN** README instructions MUST be sufficient to obtain runtime assets and run the game locally without undisclosed steps
