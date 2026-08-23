import {
  PLAYER_COLLISION_HEIGHT,
  PLAYER_COLLISION_WIDTH,
} from '@domain/constants/player';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import type Phaser from 'phaser';

export class LevelCollisionResolver {
  resolve(
    layer: Phaser.Tilemaps.TilemapLayer,
    state: PlayerState,
    previousPosition: Vector2,
  ): PlayerState {
    let { position, velocity } = state;

    if (this.overlapsSolid(layer, position.x, previousPosition.y)) {
      position = new Vector2(previousPosition.x, position.y);
      velocity = velocity.withX(0);
    }

    let isGrounded = false;
    if (this.overlapsSolid(layer, position.x, position.y)) {
      if (position.y > previousPosition.y) {
        isGrounded = true;
      }

      position = new Vector2(position.x, previousPosition.y);
      velocity = velocity.withY(0);
    } else {
      isGrounded = this.isStandingOnSolid(layer, position.x, position.y);
    }

    return new PlayerState(
      position,
      velocity,
      isGrounded,
      state.coyoteTimeRemainingMs,
      state.jumpBufferRemainingMs,
    );
  }

  private overlapsSolid(
    layer: Phaser.Tilemaps.TilemapLayer,
    centerX: number,
    feetY: number,
  ): boolean {
    const left = centerX - PLAYER_COLLISION_WIDTH / 2;
    const right = centerX + PLAYER_COLLISION_WIDTH / 2;
    const top = feetY - PLAYER_COLLISION_HEIGHT;
    const bottom = feetY;

    const startTileX = layer.worldToTileX(left, true);
    const endTileX = layer.worldToTileX(right - 1, true);
    const startTileY = layer.worldToTileY(top, true);
    const endTileY = layer.worldToTileY(bottom - 1, true);

    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
        const tile = layer.getTileAt(tileX, tileY, true);
        if (tile && this.isSolidTile(tile)) {
          return true;
        }
      }
    }

    return false;
  }

  private isStandingOnSolid(
    layer: Phaser.Tilemaps.TilemapLayer,
    centerX: number,
    feetY: number,
  ): boolean {
    const tile = layer.getTileAtWorldXY(centerX, feetY + 1, true);
    return tile !== null && this.isSolidTile(tile);
  }

  private isSolidTile(tile: Phaser.Tilemaps.Tile): boolean {
    return tile.properties.solid === true;
  }

  resolveSpawnPosition(
    layer: Phaser.Tilemaps.TilemapLayer,
    position: Vector2,
  ): Vector2 {
    let feetY = position.y;

    for (let attempt = 0; attempt < 64 && this.overlapsSolid(layer, position.x, feetY); attempt += 1) {
      feetY -= 1;
    }

    return new Vector2(position.x, feetY);
  }
}
