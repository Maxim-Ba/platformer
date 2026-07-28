import type { Vector2 } from '../value-objects/Vector2';

export interface LevelBounds {
  readonly width: number;
  readonly height: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
}

export interface PlayerSpawn {
  readonly kind: 'player_spawn';
  readonly position: Vector2;
}

export interface LevelExit {
  readonly kind: 'level_exit';
  readonly position: Vector2;
  readonly width: number;
  readonly height: number;
}

export interface HazardZone {
  readonly kind: 'hazard';
  readonly position: Vector2;
  readonly width: number;
  readonly height: number;
}

export interface Checkpoint {
  readonly kind: 'checkpoint';
  readonly id: string;
  readonly position: Vector2;
  readonly width: number;
  readonly height: number;
}

export type LevelObject = PlayerSpawn | LevelExit | HazardZone | Checkpoint;

export interface LevelDefinition {
  readonly id: string;
  readonly bounds: LevelBounds;
  readonly playerSpawn: PlayerSpawn;
  readonly exits: readonly LevelExit[];
  readonly hazards: readonly HazardZone[];
  readonly checkpoints: readonly Checkpoint[];
}
