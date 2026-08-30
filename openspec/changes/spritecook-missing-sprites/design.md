## Context

Игрок уже на SpriteCook-sheet (`idle`/`run`/`jump`/`fall` + 2-кадровый `attack` hook). Канонический стиль: `spritecook-assets.json` → `platformer-player-base` (`e885968f-c6b3-4246-8439-194f6863fc9a`). Остальной gameplay — Phaser `Rectangle`:

| Сущность | Код сейчас | Арт |
|---|---|---|
| Player attack | `PLAYER_ATTACK_FRAME_COUNT = 2`, strip indices `[2, 3]` | заглушка |
| Player dash | `setTint` + `setAlpha`, anim не играет | нет |
| Player hurt / death | fade/invuln без anim | нет |
| Grunt / flyer / caster | `EnemySprite` rectangle + цвет | `spriteKey` в каталоге не грузится |
| Caster projectile | `8×8` purple rectangle | нет |
| Melee hitbox | white rectangle `alpha 0.35` | нет VFX |
| Hazard / checkpoint / exit / door | colored rectangles в `GameScene.renderLevelObjects` | нет |
| Boundary exit | purple debug overlay | оставить debug |
| HUD / skill nodes / inventory | текст и UI-rects | вне scope |
| Tilesets | MinIO `platformer-tiles`, `beast_soldier` | уже есть |

Анимации — presentation concern (как `player-animations`). Domain `EnemyState` / `PlayerState` не расширяем скелетом. Resolver читает уже существующие флаги (`isAttacking`, dash active, HP/invuln).

Скачивание PNG: `.cursor/rules/spritecook-downloads.mdc` — агент генерирует через MCP, пишет `asset_id`, просит пользователя положить файлы в `public/assets/sprite/`.

## Goals / Non-Goals

**Goals:**

- Живой каталог пробелов (`docs/SPRITE-GAPS.md`) со статусами `have` / `generate` / `deferred`
- Сгенерировать P0+P1 через SpriteCook MCP в стиле player-base
- Собрать sheets и подключить Phaser так, чтобы в GameScene не осталось combat/world rectangle placeholders (кроме boundary-exit debug)
- Расширить player resolver: `dash`, полноценный `attack`, `hurt`

**Non-Goals:**

- UI kit, HUD-иконки, 30 skill icons, inventory icons
- Новые enemy types / боссы / loot
- Death-anim с задержкой remove (P2 в каталоге)
- Перегенерация tilesets, jump/fall multi-frame (P2)
- Автоскачивание signed URL из терминала
- Spine, particles runtime, audio

## Decisions

### 1. Приоритеты генерации (P0 → apply обязан закрыть)

**P0 — бой читается без прямоугольников**

| ID | Что генерировать | MCP | Кадры (цель) |
|---|---|---|---|
| `enemy-grunt` | base character + idle, walk | `generate_character` + `generate_character_animations` (platformer) | idle 6–8, walk 6 |
| `enemy-flyer` | base + fly/idle loop | то же, custom `fly` если нет walk-in-air | 6–8 |
| `enemy-caster` | base + idle, attack (cast) | platformer presets `idle`, `attack` | idle 6–8, attack 6 |
| `projectile-caster` | magic bolt still или loop | `generate_game_art` (+ optional `animate_game_art`) | 1 или 4 |
| `player-attack` | полный melee slash с того же `platformer-player-base` | `animate_game_art` / `generate_character_animations` `attack` | 6–8 (замена 2 кадров) |
| `player-dash` | dash/lunge | `animate_game_art` на player-base | 4–6 |

**P1 — мир и feedback**

| ID | Что | MCP |
|---|---|---|
| `player-hurt` | recoil/flinch | `animate_game_art` |
| `vfx-melee-slash` | slash overlay на hitbox | `generate_game_art` + короткий anim |
| `prop-hazard` | spikes / trap filling AABB | still `generate_game_art` |
| `prop-checkpoint` | shrine/lantern | still |
| `prop-door` | door | still |
| `prop-exit` | portal/arch | still |
| enemy `hurt` | grunt/flyer/caster hurt | character anim preset `hurt` |

**P2 — каталог фиксирует, apply не блокируется**

Player death, enemy death, jump/fall >1 frame, HUD/skill/inventory icons.

### 2. SpriteCook workflow

1. `get_credit_balance` до батча.
2. Style: `style_asset_ids` / character workflows от `platformer-player-base`. Не плодить новый player base.
3. Враги: отдельный `generate_character(perspective="platformer")` на архетип (grunt — тяжёлый пехотинец, flyer — крылатый, caster — маг). Потом `generate_character_animations` на полученный `character_id`.
4. Player dash/attack/hurt: тот же `asset_id` base, не новый персонаж.
5. Пропы и VFX: `generate_game_art` (`pixel=true`, `bg_mode=transparent`, `smart_crop_mode=tightest`, theme dark fantasy).
6. Каждый успешный job → запись в `spritecook-assets.json` (`asset_id`, `label`, `role`, `local_path`).
7. Агент **не** качает PNG. Пользователь кладёт horizontal strips в пути из таблицы ниже. Затем `python3 scripts/build-*-sheet.py`.

Локальные пути (расширение `spritecook-downloads.mdc`):

| Ассет | Файл |
|---|---|
| player-attack (новый) | `public/assets/sprite/player-attack.png` |
| player-dash | `public/assets/sprite/player-dash.png` |
| player-hurt | `public/assets/sprite/player-hurt.png` |
| grunt idle/walk/hurt | `public/assets/sprite/enemy-grunt-*.png` |
| flyer | `public/assets/sprite/enemy-flyer-*.png` |
| caster | `public/assets/sprite/enemy-caster-*.png` |
| projectile | `public/assets/sprite/projectile-caster.png` |
| slash VFX | `public/assets/sprite/vfx-melee-slash.png` |
| hazard/checkpoint/door/exit | `public/assets/sprite/prop-*.png` |

Собранные sheets: `public/assets/images/{player,enemy-grunt,enemy-flyer,enemy-caster}-sheet.png` (как сейчас player-sheet).

### 3. Presentation mapping

Анимация остаётся в presentation. Чистые resolvers без Phaser:

```typescript
type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'dash' | 'hurt';
// priority: hurt > attack > dash > airborne jump/fall > run > idle

type EnemyAnimationKey = 'idle' | 'walk' | 'fly' | 'attack' | 'hurt';
```

- Dash: если `isDashing`, играть `dash`, убрать early-return который глушит anim; tint можно оставить слабым accent, не вместо кадров.
- Hurt: context `isHurt` из invulnerability после урона (не dash i-frames) **или** краткий flash; приоритет выше movement.
- Enemy: `walk` если `|patrolDirection|` и ground-patrol с `speed>0` и ненулевой patrol; caster с `defaultPatrolDistance=0` → `idle`, при spawn projectile / attack behavior tick → `attack`; flyer → `fly`.
- `EnemySprite` / `ProjectileSprite`: `scene.add.sprite`, origin `(0.5, 1)` у врагов как сейчас, projectile origin `(0.5, 0.5)`. `setDisplaySize(archetype.width, archetype.height)`.
- Level objects: `scene.add.image` по центру Tiled AABB, `setDisplaySize(width, height)` для hazard (зона), для checkpoint/door/exit — displaySize в пределах AABB без искажения сверх меры (contain).
- Melee VFX: sprite на hitbox вместо rectangle; destroy когда attack window закрыт (как сейчас `destroyAttackFeedback`).
- Boundary exits: rectangle debug **остаётся**.

Preload: ключи в `asset-keys.ts` + catalog рядом с `FOUNDATION_ASSETS` (player sheet уже там; enemy/prop можно грузить в `GameScene` preload уровня или расширить foundation — **решение: foundation/preload catalog**, чтобы MainMenu→Game не мерцал. Пропы и враги нужны только в GameScene — грузить в `GameScene` preload вместе с tilesets, player sheet оставить в PreloadScene).

### 4. Domain не раздуваем

`spriteKey` в `ENEMY_ARCHETYPES` уже есть (`enemy-grunt` и т.д.). Change только гарантирует, что ключ = Phaser texture key после preload. Не добавляем animation state в `EnemyState`.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Только сгенерировать PNG без wiring | Плейсхолдеры останутся в игре; change не закрывает Why |
| Один spritesheet на всех врагов | Разный silhouette/hitbox; сложнее iterate по архетипу |
| Tint/scale вместо dash/hurt anim | Уже так сделано и выглядит как placeholder |
| `generate_game_art` вместо character workflow для врагов | Хуже consistency platformer perspective; нет preset anims |
| Автоdownload signed URL | Ломается на proxy; запрещено правилом репо |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Кредиты SpriteCook кончатся mid-batch | `get_credit_balance` первым; P0 до P1; не регенерировать player-base |
| Стиль врагов разъедется с игроком | Один `style_asset_ids` / character ref; pixel + transparent |
| Пользователь не скачает PNG | Sheet builder уже умеет fallback-кадры; GameScene не должен падать — но spec требует textures, apply ждёт файлы |
| Attack 6–8 кадров сломает sheet ranges | Обновить `PLAYER_ANIM_FRAME_RANGES` и `build-player-sheet.py` в том же apply |
| Death без delay выглядит обрезанно | P2; kill по-прежнему instant remove |
| DisplaySize растянет pixel art | Как у игрока (172 → display constants); для пропов contain в AABB |

## Migration Plan

1. Записать каталог `docs/SPRITE-GAPS.md` (снимок текущих rectangle/hook).
2. Сгенерировать P0 через MCP, обновить манифест, дождаться PNG от пользователя.
3. Скрипты sheet + asset keys + preload.
4. Resolvers + entity swap Rectangle→Sprite.
5. P1: hurt, VFX, props.
6. Quality gate + playtest grunt/flyer/caster/attack/dash.
7. Каталог: P0/P1 → `have`.

Rollback: вернуть rectangle factories и старые player frame ranges; PNG в gitignore/MinIO не блокируют код.

## Open Questions

- Точный frame count после генерации: ranges пишутся по факту strip (как сейчас idle=8, run=6), не заранее хардкодить в spec числа кроме «attack ≥ 6».
- Flyer preset: если workflow даёт только `walk`, использовать его как fly-loop (горизонтальный цикл крыльев) — **confirmed default**.
- Нужен ли отдельный player death в этом change: **нет (P2)**.
