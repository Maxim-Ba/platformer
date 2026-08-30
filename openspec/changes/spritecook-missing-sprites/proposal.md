## Why

Бой и типы врагов уже в игре, но визуально это цветные прямоугольники: `EnemySprite` / `ProjectileSprite` / hazards / checkpoints / doors / exits рисуются через `scene.add.rectangle`, атака игрока — 2 кадра-заглушки, рывок — tint/alpha. Игрок с SpriteCook-анимациями (idle/run/jump/fall) стоит рядом с placeholder-миром, и dark-fantasy identity ломается. Сейчас правильный момент закрыть gap: канонический `platformer-player-base` уже в `spritecook-assets.json`, SpriteCook MCP подключён, генерация может идти от того же style reference.

## What Changes

- Зафиксировать **каталог пробелов** (что есть / чего нет / приоритет) как контракт change, чтобы apply не гадал scope
- Сгенерировать недостающие спрайты и анимации через **SpriteCook MCP** (`generate_character` / `generate_game_art` / `animate_game_art` / `generate_character_animations`), стиль — pixel art, dark fantasy, `style_asset_ids` / `reference_asset_id` от `platformer-player-base`
- Записать `asset_id` и локальные пути в `spritecook-assets.json`; PNG кладёт пользователь (правило `spritecook-downloads`: агент не качает signed URL)
- Подключить ассеты в Phaser: враги, снаряд caster, melee slash VFX, объекты уровня (hazard, checkpoint, door, exit), расширить player anims (`attack` полный цикл, `dash`, `hurt`)
- Собрать enemy/player sheets скриптами по образцу `scripts/build-player-sheet.py` и зарегистрировать anim keys

**Non-goals:** UI kit / меню, иконки HUD и 30 skill-node, инвентарные иконки без world-pickups, tilesets (уже есть), boundary-exit debug overlay, Spine/skeletal, боссы, новые типы врагов, звук, particle-системы как отдельный runtime.

## Capabilities

### New Capabilities

- `combat-sprites`: каталог визуальных пробелов, SpriteCook MCP generation для combat/world спрайтов, манифест `asset_id` → `local_path`, presentation wiring вместо rectangle placeholders

### Modified Capabilities

- `player-animations`: resolver и registry MUST поддерживать `dash` и полноценный `attack`; `hurt` overlay/anim при invulnerability tick
- `infrastructure-adapters`: `EnemySprite` и `ProjectileSprite` MUST использовать загруженные textures по `spriteKey`, не `Rectangle`; dash MUST играть анимацию, а не только tint
- `enemy-archetypes`: `spriteKey` MUST резолвиться в preload texture (grunt/flyer/caster)

## Impact

- `spritecook-assets.json` — новые записи (base enemies, anims, VFX, level objects)
- `public/assets/sprite/` — PNG (после ручного download) и собранные sheets
- `scripts/` — sheet builders для врагов / VFX (по аналогии с player sheet)
- `src/game/asset-keys.ts`, `FOUNDATION_ASSETS` / preload catalog
- `src/presentation/animation/` — enemy/projectile registries, расширение player resolver
- `src/presentation/entities/EnemySprite.ts`, `ProjectileSprite.ts`, `PlayerSprite.ts`
- `src/presentation/scenes/GameScene.ts` — убрать rectangle feedback для hitbox/hazards/checkpoints/doors/exits
- `.cursor/rules/spritecook-downloads.mdc` — расширить таблицу путей для новых анимаций
