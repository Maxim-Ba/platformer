import {
  ENEMY_CASTER_SHEET_FRAME_HEIGHT,
  ENEMY_CASTER_SHEET_FRAME_WIDTH,
  ENEMY_FLYER_SHEET_FRAME_HEIGHT,
  ENEMY_FLYER_SHEET_FRAME_WIDTH,
  ENEMY_GRUNT_SHEET_FRAME_HEIGHT,
  ENEMY_GRUNT_SHEET_FRAME_WIDTH,
} from '@presentation/animation/enemySheetConfig';
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
  EnemyGrunt: 'enemy-grunt',
  EnemyFlyer: 'enemy-flyer',
  EnemyCaster: 'enemy-caster',
  ProjectileCaster: 'projectile-caster',
  VfxMeleeSlash: 'vfx-melee-slash',
  PropHazard: 'prop-hazard',
  PropCheckpoint: 'prop-checkpoint',
  PropDoor: 'prop-door',
  PropExit: 'prop-exit',
} as const;

export const PlayerAnimKeys = {
  Idle: 'player-idle',
  Run: 'player-run',
  Jump: 'player-jump',
  Fall: 'player-fall',
  Attack: 'player-attack',
  Dash: 'player-dash',
  Hurt: 'player-hurt',
} as const;

export const EnemyAnimKeys = {
  GruntIdle: 'enemy-grunt-idle',
  GruntWalk: 'enemy-grunt-walk',
  FlyerFly: 'enemy-flyer-fly',
  CasterIdle: 'enemy-caster-idle',
  CasterAttack: 'enemy-caster-attack',
} as const;

export const LEVEL_TILESET_PATH = 'assets/tilesets/platformer-tiles.png';
export const BEAST_SOLDIER_TILESET_PATH = 'assets/tilesets/beast_soldier.png';
export const ENEMY_GRUNT_SHEET_PATH = 'assets/images/enemy-grunt-sheet.png';
export const ENEMY_FLYER_SHEET_PATH = 'assets/images/enemy-flyer-sheet.png';
export const ENEMY_CASTER_SHEET_PATH = 'assets/images/enemy-caster-sheet.png';
export const PROJECTILE_CASTER_PATH = 'assets/sprite/projectile-caster.png';
export const VFX_MELEE_SLASH_PATH = 'assets/sprite/vfx-melee-slash.png';
export const PROP_HAZARD_PATH = 'assets/sprite/prop-hazard.png';
export const PROP_CHECKPOINT_PATH = 'assets/sprite/prop-checkpoint.png';
export const PROP_DOOR_PATH = 'assets/sprite/prop-door.png';
export const PROP_EXIT_PATH = 'assets/sprite/prop-exit.png';

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

export type GameCombatAssetDefinition =
  | {
      key:
        | typeof AssetKeys.EnemyGrunt
        | typeof AssetKeys.EnemyFlyer
        | typeof AssetKeys.EnemyCaster;
      path: string;
      type: 'spritesheet';
      frameWidth: number;
      frameHeight: number;
    }
  | {
      key: typeof AssetKeys.ProjectileCaster;
      path: string;
      type: 'image';
    };

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

/** Combat textures loaded in GameScene preload. Player sheet stays in PreloadScene. */
export const GAME_COMBAT_ASSETS: readonly GameCombatAssetDefinition[] = [
  {
    key: AssetKeys.EnemyGrunt,
    path: ENEMY_GRUNT_SHEET_PATH,
    type: 'spritesheet',
    frameWidth: ENEMY_GRUNT_SHEET_FRAME_WIDTH,
    frameHeight: ENEMY_GRUNT_SHEET_FRAME_HEIGHT,
  },
  {
    key: AssetKeys.EnemyFlyer,
    path: ENEMY_FLYER_SHEET_PATH,
    type: 'spritesheet',
    frameWidth: ENEMY_FLYER_SHEET_FRAME_WIDTH,
    frameHeight: ENEMY_FLYER_SHEET_FRAME_HEIGHT,
  },
  {
    key: AssetKeys.EnemyCaster,
    path: ENEMY_CASTER_SHEET_PATH,
    type: 'spritesheet',
    frameWidth: ENEMY_CASTER_SHEET_FRAME_WIDTH,
    frameHeight: ENEMY_CASTER_SHEET_FRAME_HEIGHT,
  },
  {
    key: AssetKeys.ProjectileCaster,
    path: PROJECTILE_CASTER_PATH,
    type: 'image',
  },
] as const;
