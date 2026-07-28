import type { PlayerState } from '@domain/value-objects/PlayerState';
import { AssetKeys } from '@game/asset-keys';
import Phaser from 'phaser';

const RUN_SPEED_THRESHOLD = 10;

export class PlayerSprite {
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.sprite(x, y, AssetKeys.Player);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(32, 48);
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

    this.applyMovementVisuals(state);
  }

  private applyMovementVisuals(state: PlayerState): void {
    if (!state.isGrounded) {
      this.sprite.setScale(1, 1.08);
      this.sprite.setTint(0xc4b5fd);
      return;
    }

    const isRunning = Math.abs(state.velocity.x) >= RUN_SPEED_THRESHOLD;
    this.sprite.setScale(1, isRunning ? 0.96 : 1);
    this.sprite.clearTint();
  }
}
