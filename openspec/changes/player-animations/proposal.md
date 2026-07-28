## Why

Сейчас игрок — статичный SVG с squash/tint-хаком в `PlayerSprite`: визуально не передаёт движение и не соответствует Blasphemous-inspired ощущению «точного, весомого» персонажа. Foundation MVP доказал pipeline; следующий polish-шаг — настоящие анимации (idle, run, jump, fall), синхронизированные с `PlayerState`. Это даёт быстрый визуальный скачок при минимальном gameplay-изменении.

## What Changes

- Заменить SVG-placeholder на **spritesheet** с кадровыми анимациями: `idle`, `run`, `jump`, `fall`
- Добавить **animation resolver** в presentation: `PlayerState` → animation key (чистая функция, тестируемая)
- Зарегистрировать Phaser animations в preload/bootstrap pipeline
- Обновить `PlayerSprite.syncFromState()` — play/stop anims вместо scale/tint
- Расширить asset keys и `FOUNDATION_ASSETS` для spritesheet
- Подготовить hook для **skin selection** через `ISettingsPort.cosmetics.playerSkinId` (если `game-feature-modules` применён)
- Зарезервировать animation key `attack` для совместимости с `melee-combat` (placeholder frame или отдельный кадр)
- Unit-тесты: `resolvePlayerAnimation` mapping logic
- Обновить README: структура ассетов, как заменить spritesheet

**Non-goals:** skeletal/spine animation, particle VFX, полноценная attack-анимация (отдельно в melee-combat), procedural animation.

## Capabilities

### New Capabilities

- `player-animations`: spritesheet, Phaser anims, state-to-animation mapping, skin hook

### Modified Capabilities

- `infrastructure-adapters`: `PlayerSprite` MUST play frame animations synced to movement state
- `mvp-integration`: placeholder visuals requirement upgraded to animated player representation

## Impact

- `public/assets/images/` — новый spritesheet (PNG)
- `src/game/asset-keys.ts` — ключи анимаций и spritesheet
- `src/presentation/scenes/PreloadScene.ts` — загрузка spritesheet, создание anims
- `src/presentation/entities/PlayerSprite.ts` — рефакторинг sync logic
- `src/presentation/animation/` — resolver + registry (новая папка)
- Опционально: интеграция с `ISettingsPort` для смены skin
- Совместимость: `melee-combat` может расширить resolver для `attack` state
