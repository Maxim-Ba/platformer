## 1. Assets & configuration

- [x] 1.1 Add `player-sheet.png` spritesheet to `public/assets/images/` (placeholder pixel-art, dark palette)
- [x] 1.2 Update `asset-keys.ts` — `PlayerSheet` key, animation key constants
- [x] 1.3 Update `FOUNDATION_ASSETS` — replace `player.svg` with spritesheet PNG
- [x] 1.4 Document spritesheet layout and frame ranges in README

## 2. Animation resolver (presentation, Phaser-free)

- [x] 2.1 Create `src/presentation/animation/resolvePlayerAnimation.ts`
- [x] 2.2 Define `PlayerAnimationKey` type and `AnimationResolveContext`
- [x] 2.3 Implement mapping: idle / run / jump / fall / attack (attack via context flag)
- [x] 2.4 Unit tests: `resolvePlayerAnimation.test.ts` — all state transitions

## 3. Phaser animation registry

- [x] 3.1 Create `src/presentation/animation/PlayerAnimationRegistry.ts`
- [x] 3.2 Register `player-idle`, `player-run`, `player-jump`, `player-fall`, `player-attack` anims
- [x] 3.3 Call registry from `PreloadScene.create()` after textures loaded
- [x] 3.4 Add helper `resolvePlayerTextureKey(skinId?)` for future skin swap

## 4. PlayerSprite refactor

- [x] 4.1 Remove `applyMovementVisuals` squash/tint hack
- [x] 4.2 Play animation via resolver in `syncFromState(state, context?)`
- [x] 4.3 Track `currentAnim` to avoid restarting same animation every frame
- [x] 4.4 Use spritesheet texture instead of SVG
- [x] 4.5 Preserve position rounding and horizontal flip behavior

## 5. Optional integrations

- [x] 5.1 If `ISettingsPort` available: read `playerSkinId` for texture selection
- [x] 5.2 If `ICombatPort` available (melee-combat): pass `isAttacking` in sync context from GameScene

## 6. Quality gate

- [x] 6.1 `npm run build` — zero errors
- [x] 6.2 `npm run lint` — zero errors
- [x] 6.3 `npm test` — resolver tests pass
- [x] 6.4 Manual playtest: idle, run, jump, fall transitions feel correct; no flicker
- [x] 6.5 Verify player visible from MainMenu → Game flow
