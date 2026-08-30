# Sprite visual gaps

Снимок combat/world визуалов на момент change `spritecook-missing-sprites`. Статусы:

- `have` — SpriteCook (или tileset) уже в игре / манифесте
- `generate` — цель этого change (P0 или P1)
- `deferred` — вне scope: debug overlay, UI, P2, или уже закрыто другим пайплайном

Канонический стиль: `spritecook-assets.json` → `platformer-player-base` (`e885968f-c6b3-4246-8439-194f6863fc9a`). PNG кладёт пользователь в пути из `.cursor/rules/spritecook-downloads.mdc`; агент не качает signed URL.

## Inventory

| Entity | Current visual | Target MCP | Priority | Status |
|---|---|---|---|---|
| Player idle | SpriteCook strip + sheet | — (shipped) | — | have |
| Player run | SpriteCook strip + sheet | — (shipped) | — | have |
| Player jump | SpriteCook strip + sheet | — (shipped) | — | have |
| Player fall | SpriteCook strip + sheet | — (shipped) | — | have |
| Player attack | SpriteCook 8-frame strip on player-sheet | `animate_game_art` from player-base | P0 | have |
| Player dash | SpriteCook 6-frame strip on player-sheet | `animate_game_art` from player-base | P0 | have |
| Player hurt | fade / invuln, no anim | `animate_game_art` from player-base | P1 | generate |
| Player death | instant remove | — | P2 | deferred |
| Enemy grunt | SpriteCook idle/walk sheet (`enemy-grunt`) | `generate_character` + `idle`/`walk` (platformer) | P0 | have |
| Enemy flyer | SpriteCook fly sheet (`enemy-flyer`) | `generate_character` + fly/walk loop | P0 | have |
| Enemy caster | SpriteCook idle/attack sheet (`enemy-caster`) | `generate_character` + `idle`/`attack` | P0 | have |
| Enemy hurt (grunt/flyer/caster) | none | character preset `hurt` | P1 | generate |
| Enemy death | instant remove | — | P2 | deferred |
| Caster projectile | SpriteCook still (`projectile-caster`) | `generate_game_art` (+ optional short loop) | P0 | have |
| Melee slash VFX | white rectangle `alpha 0.35` | `generate_game_art` + short anim | P1 | generate |
| Prop hazard | red rectangle in `renderLevelObjects` | `generate_game_art` still | P1 | generate |
| Prop checkpoint | yellow rectangle | `generate_game_art` still | P1 | generate |
| Prop door | cyan rectangle | `generate_game_art` still | P1 | generate |
| Prop exit | green rectangle | `generate_game_art` still | P1 | generate |
| Boundary exit | purple debug overlay | none (stay debug rectangle) | — | deferred |
| HUD icons | text / UI rects | UI kit (out of scope) | — | deferred |
| Skill-node icons | UI | UI kit (out of scope) | — | deferred |
| Inventory icons | UI, no world pickups | UI kit (out of scope) | — | deferred |
| Tilesets | MinIO `platformer-tiles`, `beast_soldier` | — (already shipped) | — | have |
| Jump/fall multi-frame | 1-frame strips | — | P2 | deferred |

## Notes

- P0 must finish before P1 if SpriteCook credits are tight (`get_credit_balance` first).
- After PNG files land, sheet builders produce `public/assets/images/{player,enemy-grunt,enemy-flyer,enemy-caster}-sheet.png`.
- After wiring, P0/P1 rows in this catalog MUST flip to `have`.
