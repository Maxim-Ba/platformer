## ADDED Requirements

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
