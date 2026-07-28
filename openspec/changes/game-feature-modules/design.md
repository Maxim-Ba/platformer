## Context

Foundation MVP завершён: Clean Architecture с портами `IInputPort`, `IPhysicsPort`, `ILevelRepository` и composition root в `src/game/composition-root.ts`. Hazard damage в `GameScene` — прямой вызов `respawnPlayer()` без HP. Нет подсистем для настроек, прогрессии и инвентаря.

Пользователь запросил четыре feature-модуля в стиле Go interfaces / Angular-Spring DI: потребители зависят от абстракций, реализации подменяются в composition root без переписывания consumers.

## Goals / Non-Goals

**Goals:**

- Четыре изолированных модуля с port-интерфейсами: health, settings, progression, inventory
- Domain rules (pure) + application use cases + infrastructure adapters
- Единственное место binding — `composition-root.ts`
- Первичная интеграция health в hazard flow (damage → HP check → respawn/death)
- Placeholder-реализации для settings/progression/inventory, готовые к расширению
- Unit-тесты domain/application для health; контрактные тесты портов
- Обновление architecture spec: interface-first rule для feature modules

**Non-Goals:**

- Полноценный UI настроек, инвентаря, skill tree (только каркас + API)
- Melee combat, враги, боссы
- Сетевая синхронизация / multiplayer
- Полная замена Phaser physics adapter
- Сложная RPG-прогрессия (talents, skill trees) — только XP/level scaffold

## Decisions

### Module pattern (повторяет существующие ports)

Каждый модуль следует одной схеме:

```
domain/           → entities, value objects, pure services (HealthRules, InventoryRules)
application/      → I*Port interface + use cases
infrastructure/   → concrete adapters (InMemory*, LocalStorage*)
game/             → composition-root bindings
presentation/     → consumers получают I*Port через SceneDependencies
```

```
┌──────────────────────────────────────────────────────────────┐
│  presentation (GameScene, SettingsScene)                     │
│       │ depends on                                           │
│       ▼                                                      │
│  application ports: IHealthPort, ISettingsPort, ...          │
│       ▲ implemented by                                       │
│  infrastructure adapters                                     │
│       │ wired in                                             │
│  composition-root.ts  ← единственное место `new Adapter()`   │
└──────────────────────────────────────────────────────────────┘
```

### Port interfaces (Interface Segregation)

| Port | Responsibility | Key methods |
|------|----------------|-------------|
| `IHealthPort` | HP state, damage, heal, death events | `getHealth()`, `applyDamage(amount)`, `isAlive()`, `isInvulnerable()` |
| `ISettingsPort` | Read/write game settings | `getSettings()`, `updateSettings(patch)`, `resetToDefaults()` |
| `IProgressionPort` | XP, levels, unlocks | `getProgression()`, `addExperience(amount)`, `getUnlockedIds()` |
| `IInventoryPort` | Items in slots | `getInventory()`, `addItem(item)`, `removeItem(id)`, `useItem(id)` |

Запрещён монолитный `IGameServices`. Каждый consumer импортирует только нужные порты.

### Health module — первая интеграция

- `HealthState` value object: `currentHp`, `maxHp`, `invulnerabilityRemainingMs`
- `HealthRules` domain service: clamp HP, check death, invulnerability decay
- `ApplyDamage` use case: orchestrates rules + port
- `InMemoryHealthAdapter` implements `IHealthPort`
- `GameScene`: hazard overlap → `deps.healthPort.applyDamage(1)` → if dead → respawn at checkpoint (сохраняем текущий flow, но через HP)

Default: `maxHp = 3`, hazard damage = 1, invulnerability 1000ms (переносим из GameScene).

### Settings module — extensible schema

```typescript
interface GameSettings {
  audio: { masterVolume: number; musicVolume: number; sfxVolume: number };
  video: { fullscreen: boolean };
  controls: { keyBindings: Record<string, string> };
  cosmetics: { playerSkinId: string };
}
```

- `LocalStorageSettingsAdapter` — persist under key `platformer:settings`
- Consumers (future audio system, PlayerSprite) read via `ISettingsPort`
- В этом change: port + adapter + use case, без Settings UI scene

### Progression module — scaffold

- `ProgressionState`: `level`, `experience`, `experienceToNextLevel`, `unlockedIds: string[]`
- `ProgressionRules`: XP curve (linear: 100 * level)
- `InMemoryProgressionAdapter` — session-only; swap to LocalStorage later
- `checkpoint` activation может вызывать `addExperience(10)` как демо-интеграция

### Inventory module — scaffold

- `InventoryItem` entity: `id`, `type`, `quantity`, `metadata`
- `InventoryState`: fixed slots (e.g. 8)
- `InventoryRules`: add with stack, remove, slot limits
- `InMemoryInventoryAdapter`
- Без UI; API готов для будущего loot/collectible

### Dependency injection wiring

Расширить `AppDependencies` и `SceneDependencies`:

```typescript
export interface AppDependencies {
  // existing...
  healthPort: IHealthPort;
  settingsPort: ISettingsPort;
  progressionPort: IProgressionPort;
  inventoryPort: IInventoryPort;
  applyDamage: ApplyDamage;
  // ...
}
```

App-level ports (settings, progression, inventory) — singleton per game session.
Scene-level: health может быть per-scene (reset on level start) или app-level — **решение: per-scene reset** через factory `createHealthPort()` в `createSceneDependencies`.

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Monolithic `PlayerState` with HP/XP/items | Violates SRP, hard to swap/test modules |
| Service locator / global registry | Hides dependencies, harder to test |
| Phaser registry for game state | Couples domain to presentation |
| Full UI for all modules now | Scope creep; каркас + health integration достаточно |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Over-abstraction для pet project | Placeholder adapters minimal; ports только с нужными методами |
| GameScene ещё толще | Health — единственная интеграция; остальное через composition root без scene changes |
| localStorage schema migration | Version field в settings JSON; defaults on parse failure |
| Per-scene vs app-level state confusion | Document in design: health per-scene, settings/progression/inventory app-level |

## Migration Plan

1. Добавить domain types и ports (no breaking changes)
2. Добавить adapters и composition root bindings
3. Рефакторить GameScene hazard flow на `IHealthPort`
4. Удалить дублирующий `hazardInvulnerabilityRemainingMs` из GameScene (перенос в health module)
5. Unit-тесты; `npm run build && npm run lint && npm test`

Rollback: revert GameScene to direct respawn; ports остаются unused.

## Open Questions

- Нужен ли отдельный `VictoryScene` при 0 HP vs respawn? → **Решение**: 0 HP → GameOverScene (как сейчас при Esc/exit), >0 HP → respawn at checkpoint
- Persist health between levels? → **Нет** в этом change; reset on level start
