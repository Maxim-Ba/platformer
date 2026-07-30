## Why

Меню персонажа уже предусматривает вкладку **Характеристики**, но показывает только текстовую заглушку. Игроку нужен классический RPG-экран атрибутов: распределяемые при level-up очки (сила, ловкость, интеллект и др.) и вычисляемые боевые параметры (защита, пулы ресурсов, крит). Сейчас — подходящий момент заложить доменную модель, порт и UI панель с mock-данными, чтобы позже подключить реальные формулы и трату очков при level-up без переделки layout.

## What Changes

- **Двухколоночная панель** во вкладке **Характеристики** меню персонажа
- **Левая колонка — атрибуты** (распределяемые очки): **Сила**, **Ловкость**, **Интеллект**, **Удача**, **Грузоподъёмность**, **Здоровье**
- **Правая колонка — параметры** (вычисляемые): **Магическая защита**, **Количество здоровья**, **Количество энергии**, **Количество маны**, **Шанс крит. удара**, **Физическая защита** и дополнительные derived stats
- **Индикатор нераспределённых очков** и кнопки **+** / **−** для атрибутов (mock: предустановленный пул очков, без реального level-up)
- **Порт `IPlayerStatsPort`** в application layer: атрибуты, derived stats, unallocated points — mock adapter на v1
- **Derived stats** на v1 вычисляются по простым domain-формулам из атрибутов (не читаются напрямую из `IHealthPort` / `IManaPort` в UI)

**Non-goals:** реальная трата очков при level-up через `IProgressionPort`, сохранение атрибутов в save file, влияние атрибутов на боевую логику (damage, movement), drag-and-drop, анимации, tooltips с формулами.

## Capabilities

### New Capabilities

- `player-stats`: доменная модель атрибутов и derived stats, порт `IPlayerStatsPort`, mock adapter, UI панель вкладки **Характеристики**

### Modified Capabilities

- `character-menu`: вкладка **Характеристики** MUST показывать двухколоночную панель атрибутов вместо текстовой заглушки (зависит от change `character-menu`)

## Impact

- `src/domain/` — `PlayerAttributes`, `DerivedStats`, `PlayerStatsRules` (формулы derived из атрибутов)
- `src/application/ports/` — `IPlayerStatsPort`
- `src/infrastructure/adapters/` — `InMemoryPlayerStatsAdapter` с mock initial state
- `src/presentation/ui/character-menu/` — `StatsTabPanel` с двухколоночным layout и +/- controls
- `src/presentation/ui/CharacterMenuOverlay.ts` — замена mock-панели stats на `StatsTabPanel`
- `src/game/composition-root.ts` — wire `IPlayerStatsPort`
- `openspec/specs/character-menu` (после merge) — delta spec
