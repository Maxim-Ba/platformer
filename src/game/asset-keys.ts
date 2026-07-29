export const AssetKeys = {
  Player: 'player',
  Ground: 'ground',
  Tileset: 'platformer-tiles',
  BeastSoldierTileset: 'beast-soldier-tiles',
} as const;

export const LEVEL_TILESET_PATH = 'assets/tilesets/platformer-tiles.png';
export const BEAST_SOLDIER_TILESET_PATH = 'assets/tilesets/beast_soldier.png';

export type AssetKey = (typeof AssetKeys)[keyof typeof AssetKeys];

export type FoundationAssetType = 'image' | 'svg';

export interface FoundationAssetDefinition {
  key: AssetKey;
  path: string;
  type: FoundationAssetType;
}

/** Foundation assets loaded in PreloadScene before MainMenu. Paths are relative to `public/`. */
export const FOUNDATION_ASSETS: readonly FoundationAssetDefinition[] = [
  { key: AssetKeys.Player, path: 'assets/images/player.svg', type: 'svg' },
  { key: AssetKeys.Ground, path: 'assets/images/ground.svg', type: 'svg' },
] as const;
