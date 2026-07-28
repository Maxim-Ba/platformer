## 1. Assets & configuration

- [ ] 1.1 Add `player-sheet.png` spritesheet to `public/assets/images/` (placeholder pixel-art, dark palette)
- [ ] 1.2 Update `asset-keys.ts` — `PlayerSheet` key, animation key constants
- [ ] 1.3 Update `FOUNDATION_ASSETS` — replace `player.svg` with spritesheet PNG
- [ ] 1.4 Document spritesheet layout and frame ranges in README

## 2. Animation resolver (presentation, Phaser-free)

- [ ] 2.1 Create `src/presentation/animation/resolvePlayerAnimation.ts`
- [ ] 2.2 Define `PlayerAnimationKey` type and `AnimationResolveContext`
- [ ] 2.3 Implement mapping: idle / run / jump / fall / attack (attack via context flag)
- [ ] 2.4 Unit tests: `resolvePlayerAnimation.test.ts` — all state transitions

## 3. Phaser animation registry

- [ ] 3.1 Create `src/presentation/animation/PlayerAnimationRegistry.ts`
- [ ] 3.2 Register `player-idle`, `player-run`, `player-jump`, `player-fall`, `player-attack` anims
- [ ] 3.3 Call registry from `PreloadScene.create()` after textures loaded
- [ ] 3.4 Add helper `resolvePlayerTextureKey(skinId?)` for future skin swap

## 4. PlayerSprite refactor

- [ ] 4.1 Remove `applyMovementVisuals` squash/tint hack
- [ ] 4.2 Play animation via resolver in `syncFromState(state, context?)`
- [ ] 4.3 Track `currentAnim` to avoid restarting same animation every frame
- [ ] 4.4 Use spritesheet texture instead of SVG
- [ ] 4.5 Preserve position rounding and horizontal flip behavior

## 5. Optional integrations

- [ ] 5.1 If `ISettingsPort` available: read `playerSkinId` for texture selection
- [ ] 5.2 If `ICombatPort` available (melee-combat): pass `isAttacking` in sync context from GameScene

## 6. Quality gate

- [ ] 6.1 `npm run build` — zero errors
- [ ] 6.2 `npm run lint` — zero errors
- [ ] 6.3 `npm test` — resolver tests pass
- [ ] 6.4 Manual playtest: idle, run, jump, fall transitions feel correct; no flicker
- [ ] 6.5 Verify player visible from MainMenu → Game flow
