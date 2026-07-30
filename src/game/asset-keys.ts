import {
  PLAYER_SHEET_FRAME_HEIGHT,
  PLAYER_SHEET_FRAME_WIDTH,
} from '@presentation/animation/playerSheetConfig';

export const AssetKeys = {
  Player: 'player',
  PlayerSheet: 'player-sheet',
  Ground: 'ground',
  Tileset: 'platformer-tiles',
  BeastSoldierTileset: 'beast-soldier-tiles',
} as const;

export const PlayerAnimKeys = {
  Idle: 'player-idle',
  Run: 'player-run',
  Jump: 'player-jump',
  Fall: 'player-fall',
  Attack: 'player-attack',
} as const;

export const LEVEL_TILESET_PATH = 'assets/tilesets/platformer-tiles.png';
export const BEAST_SOLDIER_TILESET_PATH = 'assets/tilesets/beast_soldier.png';

export type AssetKey = (typeof AssetKeys)[keyof typeof AssetKeys];

export type FoundationAssetType = 'image' | 'svg' | 'spritesheet';

export interface SpritesheetAssetDefinition {
  key: typeof AssetKeys.PlayerSheet;
  path: string;
  type: 'spritesheet';
  frameWidth: number;
  frameHeight: number;
}

export type FoundationAssetDefinition =
  | {
      key: Exclude<AssetKey, typeof AssetKeys.PlayerSheet>;
      path: string;
      type: Exclude<FoundationAssetType, 'spritesheet'>;
    }
  | SpritesheetAssetDefinition;

/** Foundation assets loaded in PreloadScene before MainMenu. Paths are relative to `public/`. */
export const FOUNDATION_ASSETS: readonly FoundationAssetDefinition[] = [
  {
    key: AssetKeys.PlayerSheet,
    path: 'assets/images/player-sheet.png',
    type: 'spritesheet',
    frameWidth: PLAYER_SHEET_FRAME_WIDTH,
    frameHeight: PLAYER_SHEET_FRAME_HEIGHT,
  },
  { key: AssetKeys.Ground, path: 'assets/images/ground.svg', type: 'svg' },
] as const;
