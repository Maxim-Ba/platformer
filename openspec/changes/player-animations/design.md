## Context

`PlayerSprite` использует `player.svg` и визуальные хаки (scale squash, tint при прыжке) для имитации движения. `PlayerState` уже содержит всё необходимое для выбора анимации: `velocity`, `isGrounded`. PreloadScene загружает foundation assets через `FOUNDATION_ASSETS`.

`game-feature-modules` вводит `ISettingsPort` с `cosmetics.playerSkinId` — можно подключить смену скина без переписывания resolver.

## Goals / Non-Goals

**Goals:**

- Spritesheet с 4 базовыми анимациями: idle, run, jump, fall
- Автоматический выбор анимации из `PlayerState` каждый кадр
- Phaser anims зарегистрированы централизованно при preload
- Тестируемый `resolvePlayerAnimation(state, context?)` без Phaser
- Подготовка к skin swap и attack state (melee-combat)
- Удаление squash/tint placeholder logic

**Non-Goals:**

- Профессиональный pixel art pipeline (Aseprite export automation)
- Blend trees, animation events, root motion
- Полная attack animation sequence (melee-combat change)
- Enemy animations
- Audio sync с шагами

## Decisions

### Animation state model (presentation layer)

Анимация — presentation concern, не domain. Domain `PlayerState` не меняется.

```typescript
type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'fall' | 'attack';

interface AnimationResolveContext {
  isAttacking?: boolean;  // for melee-combat integration
  runSpeedThreshold?: number;
}
```

**Resolver rules:**

| Condition | Animation |
|-----------|-----------|
| `isAttacking` (context) | `attack` |
| `!isGrounded` && `velocity.y < 0` | `jump` |
| `!isGrounded` && `velocity.y >= 0` | `fall` |
| `isGrounded` && `|velocity.x| >= threshold` | `run` |
| `isGrounded` otherwise | `idle` |

Threshold default: 10 (как текущий `RUN_SPEED_THRESHOLD`).

### Spritesheet layout

Placeholder spritesheet (bundled in repo, pixel-art style, dark palette):

```
Frame size: 32×48 px
Layout: horizontal strip or grid

| idle (4 frames) | run (6 frames) | jump (1 frame) | fall (1 frame) | attack (2 frames) |
```

Файл: `public/assets/images/player-sheet.png`

Альтернатива при отсутствии арта: сгенерировать простой colored pixel sheet в репо (4 цвета, силуэт).

### Phaser animation registry

Новый модуль `src/presentation/animation/PlayerAnimationRegistry.ts`:

```typescript
export function registerPlayerAnimations(
  scene: Phaser.Scene,
  textureKey: string,
): void {
  scene.anims.create({ key: 'player-idle', frames: ..., frameRate: 8, repeat: -1 });
  scene.anims.create({ key: 'player-run', ... });
  // ...
}
```

Вызывается в `PreloadScene.create()` после загрузки texture (anims требуют loaded texture).

### PlayerSprite refactor

```typescript
syncFromState(state: PlayerState, context?: AnimationResolveContext): void {
  // position + flip (existing)
  const animKey = resolvePlayerAnimation(state, context);
  if (this.currentAnim !== animKey) {
    this.sprite.play(`player-${animKey}`, true);
    this.currentAnim = animKey;
  }
}
```

Убрать `applyMovementVisuals` (scale/tint).

### Skin support (optional hook)

```typescript
function resolvePlayerTextureKey(settingsPort?: ISettingsPort): string {
  const skinId = settingsPort?.getSettings().cosmetics.playerSkinId ?? 'default';
  return skinId === 'default' ? AssetKeys.PlayerSheet : `player-sheet-${skinId}`;
}
```

В v1: только `default` skin в репо. Hook готов для будущих скинов.

### Asset pipeline changes

`asset-keys.ts`:
```typescript
PlayerSheet: 'player-sheet',
PlayerAnims: { Idle: 'player-idle', Run: 'player-run', ... }
```

`FOUNDATION_ASSETS`: заменить `player.svg` на `player-sheet.png` (type: `image`).

`player.svg` — оставить в репо как reference или удалить после миграции.

### melee-combat compatibility

`GameScene` при вызове `syncFromState` передаёт `{ isAttacking: combatPort.getAttackState().isActive }`.

Attack anim: 2-frame placeholder; полная анимация — scope melee-combat.

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Spine/DragonBones | Over-engineering; external runtime dependency |
| Separate SVG per state | No smooth run cycle; harder to maintain |
| Animation state in domain | Presentation leak into domain layer |
| Runtime generated textures | Harder to art-swap; poor dark fantasy feel |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Placeholder art looks cheap | Document swap path in README; dark palette matches game |
| Anim flicker on state boundary | Only switch anim when key changes; use small velocity threshold |
| PreloadScene grows | Extract `PlayerAnimationRegistry` |
| Skin system unused in v1 | Hook only; no UI required |

## Migration Plan

1. Add spritesheet asset + asset keys
2. Add resolver + unit tests
3. Register Phaser anims in PreloadScene
4. Refactor PlayerSprite
5. Remove squash/tint; verify flip still works
6. Manual playtest all movement states
7. Update README asset section

Rollback: revert to `player.svg` in FOUNDATION_ASSETS and old PlayerSprite.

## Open Questions

- Spritesheet source: bundled placeholder PNG in repo — **confirmed**
- Attack frames included now for melee-combat hook — **yes, 2 placeholder frames**
