# architecture-foundation

## Purpose

Архитектурный каркас Clean Architecture: слои domain/application/infrastructure/presentation, port interfaces, composition root и guardrails для изоляции domain от Phaser.

## Requirements

### Requirement: Clean Architecture layers

The codebase MUST be organized into four layers: domain, application, infrastructure, and presentation, with dependencies pointing inward only.

#### Scenario: Domain isolation from Phaser

- **WHEN** a file is located under `src/domain/`
- **THEN** it MUST NOT import from `phaser` or `src/presentation/` or `src/infrastructure/`

#### Scenario: Application depends on abstractions

- **WHEN** a use case requires external capabilities (input, physics, levels, audio)
- **THEN** it MUST depend on port interfaces in `src/application/ports/`, not concrete adapters

### Requirement: Composition Root pattern

All concrete dependency bindings MUST be registered in a single composition root module.

#### Scenario: Single wiring location

- **WHEN** a new adapter implementation is introduced
- **THEN** it MUST be bound to its port interface only in `src/game/composition-root.ts` (or equivalent documented module)

#### Scenario: Scenes receive dependencies via constructor or factory

- **WHEN** a Phaser Scene is instantiated
- **THEN** its use cases and ports MUST be injected from the composition root, not constructed with `new ConcreteAdapter()` inside the scene

### Requirement: SOLID compliance rules

The project MUST apply SOLID principles as enforceable conventions documented in design and reflected in code structure.

#### Scenario: Single Responsibility for use cases

- **WHEN** a new gameplay behavior is added (movement, level load, scene transition)
- **THEN** it MUST live in a dedicated use case class with one primary responsibility

#### Scenario: Open/Closed for hazards and interactables

- **WHEN** a new object type is added to Tiled object layers
- **THEN** it MUST be handled via extension (new handler/strategy) without modifying unrelated collision or spawn logic

#### Scenario: Interface Segregation for ports

- **WHEN** a port interface is defined
- **THEN** it MUST expose only methods required by its consumers; monolithic `IGameServices` interfaces are prohibited

### Requirement: Project directory structure

The repository MUST follow the documented folder layout separating domain, application, infrastructure, presentation, and game bootstrap.

#### Scenario: New feature placement

- **WHEN** a contributor adds gameplay logic
- **THEN** pure rules MUST go to domain, orchestration to application, Phaser/Tiled code to infrastructure/presentation respectively

### Requirement: Feature module port pattern

Each gameplay feature module (health, settings, progression, inventory, and future modules) MUST define a dedicated port interface in `src/application/ports/` that consumers depend on.

#### Scenario: No concrete imports in consumers

- **WHEN** a file under `src/presentation/` or `src/application/use-cases/` uses a feature module
- **THEN** it MUST import only the port interface type, not concrete adapter classes from `src/infrastructure/`

#### Scenario: Adapter binding in composition root only

- **WHEN** a feature module adapter is instantiated
- **THEN** `new ConcreteAdapter()` MUST appear only in `src/game/composition-root.ts` (or documented factory called exclusively from composition root)

#### Scenario: Replace implementation without consumer changes

- **WHEN** adapter implementation is swapped for the same port interface
- **THEN** consumers MUST require no code changes beyond composition root binding

### Requirement: Feature module internal structure

Each feature module MUST follow the layered structure: domain rules → application port + use cases → infrastructure adapter.

#### Scenario: Domain purity

- **WHEN** domain rules are added for a feature module
- **THEN** they MUST live under `src/domain/` and MUST NOT import Phaser or infrastructure

#### Scenario: Use case orchestration

- **WHEN** a feature operation spans rules and port state
- **THEN** orchestration MUST live in a dedicated use case under `src/application/use-cases/`

### Requirement: TypeScript strict mode

The project MUST compile with TypeScript strict mode enabled.

#### Scenario: Strict compilation

- **WHEN** `npm run build` executes
- **THEN** compilation MUST succeed with `strict: true` in tsconfig without implicit-any violations in source layers
