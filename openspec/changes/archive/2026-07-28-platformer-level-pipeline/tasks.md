## 1. Level pipeline (Tiled)

- [x] 1.1 Create `tiled/` project with tileset and `level-01.tmx` (layers: `ground`, `decor`, `objects`)
- [x] 1.2 Define tile custom property `solid: true` and object types: `player_spawn`, `level_exit`, `hazard`, `checkpoint`
- [x] 1.3 Export `level-01.json` to `public/assets/maps/`
- [x] 1.4 Define domain `LevelDefinition` and typed level objects
- [x] 1.5 Implement `TiledLevelRepository` (`ILevelRepository`) parsing JSON to domain model
- [x] 1.6 Implement `LoadLevel` use case and tilemap rendering in GameScene
- [x] 1.7 Configure tilemap collision via `solid` property
- [x] 1.8 Implement hazard overlap → damage, checkpoint activation, level exit trigger
