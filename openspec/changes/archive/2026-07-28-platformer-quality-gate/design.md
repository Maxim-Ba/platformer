## Context

Этап 8 из 8. Финальный quality gate перед archive.

## Goals / Non-Goals

**Goals:**

- Zero build/lint errors.
- All domain/application tests green.
- Manual playtest sign-off.
- Layer boundary audit.

**Non-Goals:**

- New features, performance profiling, deployment.

## Decisions

### Verification checklist

1. `npm run build`
2. `npm run lint`
3. `npm test` (Vitest)
4. Manual: movement, collision, scenes, respawn, exit
5. Grep/script: no phaser in domain/application

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Skipping manual playtest | Document results in task checkbox comments or session notes |
