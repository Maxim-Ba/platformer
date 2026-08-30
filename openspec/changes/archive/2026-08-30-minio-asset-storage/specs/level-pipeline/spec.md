## MODIFIED Requirements

### Requirement: Tiled JSON level loading

Levels MUST be authored in Tiled, exported as JSON, and loaded at runtime through a level repository adapter. The adapter MUST fetch map JSON from the configured asset base URL plus `assets/maps/{levelId}.json` (empty base in local Vite, `/media/` in production).

#### Scenario: Load tilemap from public assets

- **WHEN** GameScene starts with a configured level id
- **THEN** TiledLevelRepository MUST load the corresponding JSON from `{assetBaseUrl}assets/maps/{levelId}.json`

#### Scenario: Render tile layers

- **WHEN** level load succeeds
- **THEN** `ground` and `decor` tile layers MUST be rendered in documented draw order
