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

Static game assets MUST reside under `public/assets/` with subdirectories for maps, images, and audio.

#### Scenario: Asset loading path convention

- **WHEN** PreloadScene loads assets
- **THEN** paths MUST be relative to `public/` using documented keys from `assetKeys` module

### Requirement: Developer tooling baseline

The project MUST include ESLint and Prettier configuration suitable for TypeScript game code.

#### Scenario: Lint command exists

- **WHEN** developer runs the documented lint command
- **THEN** TypeScript sources MUST be linted with zero errors on a clean foundation scaffold

### Requirement: README bootstrap documentation

The repository MUST include a README describing prerequisites, install, dev, build, and project structure overview.

#### Scenario: New contributor onboarding

- **WHEN** a developer clones the repository
- **THEN** README instructions MUST be sufficient to run the game locally without undisclosed steps
