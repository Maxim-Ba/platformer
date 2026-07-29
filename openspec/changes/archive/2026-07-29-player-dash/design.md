## Context

Foundation MVP и `game-feature-modules` дают движение игрока (`UpdatePlayerMovement`, coyote/jump buffer), систему здоровья с invulnerability frames (`IHealthPort`, `HealthRules`) и прогрессию с unlock registry (`IProgressionPort`). На уровне 2 уже настроен unlock id `dash`, но механика рывка отсутствует.

Hazard damage в `GameScene` уже проверяет `healthPort.isInvulnerable()` перед нанесением урона — dash может переиспользовать существующий `grantInvulnerability()` без новой подсистемы урона.

## Goals / Non-Goals

**Goals:**

- Рывок по нажатию клавиши (Shift / K) в направлении взгляда игрока
- Фиксированная длительность рывка с горизонтальной скоростью; гравитация отключена на время рывка
- Неуязвимость на всю длительность рывка через `IHealthPort.grantInvulnerability()`
- Cooldown после рывка; нельзя спамить
- Gating: рывок только если `progressionPort.isUnlocked('dash')`
- Domain rules testable без Phaser; `IDashPort` — interface-first
- Визуальный feedback (tint/alpha) во время рывка

**Non-Goals:**

- Air dash, double dash, dash cancel, dash attack
- Stamina/energy cost (energy port существует, но не используется в v1)
- Прохождение сквозь стены / i-frames после рывка (post-dash iframes — только то, что даёт сам dash duration)
- Dash animation spritesheet
- Gamepad support (только keyboard v1)

## Decisions

### Dash architecture

```
GameScene.update()
  ├── healthPort.tick(delta)
  ├── dashPort.tick(delta)                    // decay active + cooldown
  ├── if dash input && can dash:
  │     └── ExecuteDash
  │           ├── DashRules.startDash()
  │           ├── dashPort.startDash(direction)
  │           └── healthPort.grantInvulnerability(DASH_DURATION_MS)
  ├── if dashPort.isDashing():
  │     └── UpdatePlayerDash (override velocity, move, skip normal movement)
  └── else:
        └── UpdatePlayerMovement (existing)
```

**Почему отдельный use case, а не только расширение MovementRules:** рывок имеет собственный lifecycle (active/cooldown), gating через progression и side-effect на health port — это orchestration layer, не чистая физика.

### Port interface

**IDashPort** — состояние рывка:
- `getDashState(): DashState` (`isDashing`, `remainingMs`, `cooldownRemainingMs`, `direction: -1 | 1`)
- `startDash(direction: -1 | 1): void`
- `tick(deltaMs: number): void`
- `canStartDash(): boolean` (not dashing, cooldown elapsed)

Consumers зависят только от интерфейса; `InMemoryDashAdapter` хранит state и делегирует `DashRules`.

### Domain models

```typescript
// DashState
{
  isDashing: boolean;
  remainingMs: number;
  cooldownRemainingMs: number;
  direction: -1 | 1;
}

// Constants (src/domain/constants/dash.ts)
DASH_SPEED = 600;           // px/s horizontal
DASH_DURATION_MS = 200;
DASH_COOLDOWN_MS = 800;
```

### DashRules (pure)

- `canStart(state)`: `!state.isDashing && state.cooldownRemainingMs <= 0`
- `startDash(state, direction)`: set `isDashing=true`, `remainingMs=DASH_DURATION_MS`, `direction`
- `tick(state, deltaMs)`: decay `remainingMs`; when hits 0 → `isDashing=false`, set `cooldownRemainingMs=DASH_COOLDOWN_MS`; else decay cooldown when not dashing
- `getDashVelocity(direction)`: `Velocity(direction * DASH_SPEED, 0)` — no gravity during dash

### Direction resolution

При нажатии dash:
1. Если `horizontalAxis !== 0` → dash в сторону ввода
2. Иначе → dash в `playerSprite.facingDirection` (последнее направление взгляда)

Если facing неизвестен (0) — dash вправо по умолчанию.

### Movement integration

Во время `isDashing`:
- `UpdatePlayerMovement` **не вызывается**
- `UpdatePlayerDash` применяет dash velocity, двигает position, collision resolve как обычно
- Jump/horizontal input игнорируются

**Альтернатива (отклонена):** встроить dash branch внутрь `UpdatePlayerMovement` — раздувает use case и смешивает обычное движение с ability lifecycle.

### Health / invulnerability integration

При старте рывка:
```typescript
healthPort.grantInvulnerability(DASH_DURATION_MS);
```

`grantInvulnerability` уже берёт `max(existing, duration)` — если игрок только что получил hazard iframes, dash не сократит их.

Hazard check в `GameScene` уже пропускает урон при `isInvulnerable()` — дополнительных изменений в `ApplyDamage` не нужно.

**Post-dash:** отдельные iframes после рывка **не добавляем** в v1 — неуязвимость = ровно duration рывка.

### Progression gating

`ExecuteDash` проверяет `progressionPort.isUnlocked('dash')` перед стартом. Если не разблокирован — input игнорируется без ошибки.

Для dev/playtest без progression: unlock `dash` через существующий `addExperience` до level 2 или временный debug unlock в composition root (не в scope change).

### Input extension

`IInputPort.isDashPressed(): boolean` — Left Shift (primary), K (alternate).

Расширить `InputSnapshot`:
```typescript
dashPressed: boolean;
```

`createInputSnapshot` в GameScene добавляет `dashPressed`.

**Конфликт с character-menu:** если change `character-menu` применён, K = Skills tab. При одновременном применении обоих changes — dash key меняется на Shift-only или L. **Рекомендация для tasks:** Shift primary; K alternate только если character-menu не применён.

### Presentation feedback

- `PlayerSprite.setDashing(true)`: alpha 0.6 или cyan tint `#88ccff` на время рывка
- Сброс при `isDashing=false`

Без trail particles / dash sprite в v1.

### Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Dash as part of PlayerState fields | Смешивает movement state с ability cooldown; порт чище |
| Separate invulnerability flag for dash | Дублирует health port; existing `isInvulnerable()` достаточен |
| Energy cost via `IEnergyPort` | Over-engineering для v1; cooldown достаточен |
| Dash through enemies without i-frames | Требует collision layers; v1 — только i-frames |

## Risks / Trade-offs

- **[Risk] Dash + hazard overlap at dash end** → игрок может получить урон сразу после рывка, если стоит в hazard. **Mitigation:** ожидаемое поведение; post-dash iframes — future enhancement.
- **[Risk] Key conflict (K) with character-menu** → dash не сработает или откроет меню. **Mitigation:** Shift как primary; документировать в controls hint.
- **[Risk] Dash into wall leaves player inside tile** → collision resolver уже clamp'ит позицию; dash distance короткий (200ms × 600px/s = 120px).
- **[Trade-off] No air dash** → проще баланс и collision; ограничивает mobility в воздухе.

## Migration Plan

1. Domain constants + rules + tests
2. Port + adapter + use cases
3. Input adapter + composition root
4. GameScene integration + visual feedback
5. Controls hint update
6. Quality gate (build, lint, test, manual playtest)

Rollback: удалить dash wiring из GameScene; порты остаются неиспользуемыми без breaking existing movement.

## Open Questions

- Нужен ли ground-only dash в v1? **Решение:** разрешить dash в воздухе (проще input, стандарт для platformer dodge) — при необходимости ограничить в follow-up.
- Нужны ли post-dash iframes? **Решение:** нет в v1.
