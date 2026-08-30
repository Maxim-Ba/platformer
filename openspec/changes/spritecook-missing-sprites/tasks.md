## 1. Gap catalog

- [x] 1.1 Create `docs/SPRITE-GAPS.md` with the inventory table (entity, current visual, target MCP, status `have`/`generate`/`deferred`)
- [x] 1.2 Mark player idle/run/jump/fall and tilesets as `have`; boundary-exit, HUD, skills, inventory as `deferred`
- [x] 1.3 Mark P0 (enemies, projectile, player attack/dash) and P1 (hurt, slash VFX, props) as `generate`
- [x] 1.4 Extend `.cursor/rules/spritecook-downloads.mdc` with the new PNG path table from design.md

## 2. SpriteCook P0 generation

- [x] 2.1 Call SpriteCook `get_credit_balance`; abort P1 if credits cannot cover remaining P0
- [x] 2.2 Confirm canonical player base id from `spritecook-assets.json` (`platformer-player-base`)
- [x] 2.3 Generate grunt platformer character + idle and walk (or run) animations; save ids in manifest
- [x] 2.4 Generate flyer platformer character + fly/walk loop; save ids in manifest
- [x] 2.5 Generate caster platformer character + idle and attack (cast) animations; save ids in manifest
- [x] 2.6 Generate caster projectile still (optional short loop) via `generate_game_art`; save id
- [x] 2.7 Animate player `attack` (≥6 frames) from player-base; replace previous attack role in manifest
- [x] 2.8 Animate player `dash` from player-base; save id and `local_path` `player-dash.png`
- [x] 2.9 Ask the user to download P0 PNG strips into the documented `public/assets/sprite/` paths (no terminal signed-URL download)

## 3. SpriteCook P1 generation

- [x] 3.1 Animate player `hurt` from player-base; save id
- [x] 3.2 Generate enemy `hurt` anims for grunt, flyer, caster; save ids
- [x] 3.3 Generate melee slash VFX still or short anim; save id
- [x] 3.4 Generate prop stills: hazard, checkpoint, door, exit; save ids
- [x] 3.5 Ask the user to download P1 PNGs into documented paths

## 4. Sheet builders and asset keys

- [x] 4.1 After user confirms P0 files exist, update `scripts/build-player-sheet.py` (and `.mjs` if kept) for dash, hurt, and attack ≥6 frames; rebuild `player-sheet.png`
- [x] 4.2 Add `scripts/build-enemy-sheet.py` (grunt/flyer/caster strips → `public/assets/images/enemy-*-sheet.png`)
- [x] 4.3 Update `PLAYER_ANIM_FRAME_RANGES` and frame counts from actual strips
- [x] 4.4 Add enemy/projectile/VFX/prop keys and paths in `src/game/asset-keys.ts`
- [x] 4.5 Load enemy sheets, projectile, VFX, and props in GameScene (or shared preload catalog); player sheet stays in PreloadScene

## 5. Player animation wiring

- [x] 5.1 Extend `PlayerAnimationKey` and `resolvePlayerAnimation` with `dash` and `hurt` and documented priority
- [x] 5.2 Unit tests for resolver: hurt > attack > dash > jump/fall > run > idle
- [x] 5.3 Register Phaser anims for dash and hurt; expand attack frame range
- [x] 5.4 `PlayerSprite.setDashing`: play dash anim; tint only as optional accent
- [x] 5.5 Pass hurt context from GameScene when damage invulnerability is active (not dash i-frames)

## 6. Enemy and projectile wiring

- [x] 6.1 Add Phaser-free `resolveEnemyAnimation` + unit tests (grunt walk, caster idle/attack, flyer fly)
- [x] 6.2 Add `EnemyAnimationRegistry` and register per-archetype anims after textures load
- [x] 6.3 Rewrite `EnemySprite` to `scene.add.sprite` using archetype `spriteKey` and `setDisplaySize(width, height)`
- [x] 6.4 Rewrite `ProjectileSprite` to textured sprite (projectile key)
- [x] 6.5 Verify `ENEMY_ARCHETYPES.spriteKey` values match loaded texture keys (`enemy-grunt`, `enemy-flyer`, `enemy-caster`)

## 7. Level props and melee VFX

- [x] 7.1 Replace hazard/checkpoint/door/exit rectangles in `GameScene.renderLevelObjects` with prop images sized to Tiled AABB
- [x] 7.2 Keep boundary-exit rectangles as debug overlays
- [x] 7.3 Replace melee hitbox white rectangle with slash VFX sprite; destroy when attack window ends

## 8. Quality gate

- [x] 8.1 Update `docs/SPRITE-GAPS.md` statuses: P0/P1 → `have` after files and wiring land
- [x] 8.2 `npm run lint` — zero errors
- [x] 8.3 `npm test` — resolver tests pass
- [x] 8.4 `npm run build` — zero errors
- [x] 8.5 Manual playtest: grunt/flyer/caster distinct sprites, projectile not a square, attack cycle, dash anim, props not colored boxes
