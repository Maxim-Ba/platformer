## Context

Этап 2 из 8. Scaffold готов; добавляем архитектурный каркас без gameplay.

## Goals / Non-Goals

**Goals:**

- Четыре слоя CA с inward dependencies.
- Composition Root — единственное место concrete bindings.
- SOLID conventions зафиксированы в design и структуре.

**Non-Goals:**

- Реализация use cases (этап 3).
- Phaser adapters (этап 4).

## Decisions

### Layer diagram

```
presentation/  → Scenes, Sprites, UI
infrastructure/ → Phaser/Tiled adapters
application/   → Use cases, ports
domain/        → Entities, value objects, pure rules
```

### Composition Root

`src/game/composition-root.ts` — все `new ConcreteAdapter()` только здесь.

### SOLID mapping

| Principle | Rule |
|-----------|------|
| S | Один use case — одна ответственность |
| O | Новые Tiled object types — новые handlers |
| L | Реализации портов взаимозаменяемы |
| I | Отдельные порты, без `IGameServices` |
| D | Scenes/use cases → interfaces |

### ESLint boundary

Запрет `import ... from 'phaser'` в `src/domain/**` и `src/application/**`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Over-engineering | Placeholder bindings, без лишних абстракций |
| Empty layers feel heavy | Минимальные index/barrel files |
