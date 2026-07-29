## Why

Меню персонажа уже предусматривает вкладку **Скилы**, но показывает только текстовую заглушку. Игроку нужен визуальный каркас прогрессии: три дерева умений (физические, энергетические, магические), открываемые за XP, плюс отображение **выбранных** скилов в HUD во время геймплея. Сейчас — подходящий момент заложить mock-данные, UI деревьев и слот выбора без полной боевой интеграции эффектов.

## What Changes

- **Три mock-дерева скилов** во вкладке **Скилы** меню персонажа: **Физические**, **Энергетические**, **Магические**
- **Бинарное разрастающееся дерево** на 4 уровня: уровень 1 — 1 узел (корень), уровень 4 — 4 узла (листья); каждый узел (кроме корня) имеет ровно одного родителя, у родителя — до двух детей
- **Переключение между деревьями** внутри вкладки (табы или селектор категории)
- **Выбор активных скилов** из открытых узлов (mock unlock state) с ограниченным числом слотов
- **HUD-виджет** справа внизу: отображение выбранных скилов во время геймплея
- **Порт `ISkillsPort`** (или аналог) в application layer: деревья, unlock state, selected loadout — mock adapter на v1
- Контент деревьев и loadout — **mock**, без реального применения эффектов в бою

**Non-goals:** трата XP при разблокировке, боевые эффекты скилов, сохранение loadout в save file, анимации прокачки, drag-and-drop, интеграция с вкладкой **Активные умения** (кроме общего порта при необходимости).

## Capabilities

### New Capabilities

- `player-skills`: доменная модель бинарных деревьев скилов, порт выбора/loadout, mock-данные трёх категорий, UI панель деревьев во вкладке Скилы

### Modified Capabilities

- `game-hud`: новый виджет выбранных скилов в правом нижнем углу экрана
- `character-menu`: вкладка **Скилы** MUST показывать интерактивные деревья вместо текстовой заглушки (зависит от change `character-menu`)

## Impact

- `src/application/ports/` — `ISkillsPort`, типы `SkillTree`, `SkillNode`, `SkillLoadout`
- `src/infrastructure/adapters/` — `InMemorySkillsAdapter` с mock unlock и selected state
- `src/domain/` — константы/правила деревьев (4 уровня, бинарная структура), mock tree definitions
- `src/presentation/ui/character-menu/` — `SkillsTabPanel` с рендером деревьев и выбором узлов
- `src/presentation/ui/hud/` — `SelectedSkillsHudWidget`, обновление `hud-layout.ts` и `GameHud`
- `src/presentation/scenes/GameScene.ts` — wire `ISkillsPort` в HUD и character menu
- `openspec/specs/game-hud`, `character-menu` (после merge) — delta specs
