import type { PlayerState } from '@domain/value-objects/PlayerState';
import { AssetKeys } from '@game/asset-keys';
import Phaser from 'phaser';

export class PlayerSprite {
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.sprite(x, y, AssetKeys.Player);
    this.sprite.setOrigin(0.5, 1);
  }

  syncFromState(state: PlayerState): void {
    this.sprite.setPosition(
      Math.round(state.position.x),
      Math.round(state.position.y),
    );

    if (state.velocity.x < 0) {
      this.sprite.setFlipX(true);
    } else if (state.velocity.x > 0) {
      this.sprite.setFlipX(false);
    }
  }
}
