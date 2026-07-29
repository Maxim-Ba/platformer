import type { PlayerState } from '@domain/value-objects/PlayerState';
import { AssetKeys } from '@game/asset-keys';
import Phaser from 'phaser';

const RUN_SPEED_THRESHOLD = 10;
const DASH_TINT = 0x88ccff;
const DASH_ALPHA = 0.6;

export class PlayerSprite {
  readonly sprite: Phaser.GameObjects.Sprite;
  private facingDirection: -1 | 1 = 1;
  private isDashing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.sprite(x, y, AssetKeys.Player);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(32, 48);
  }

  getFacingDirection(): -1 | 1 {
    return this.facingDirection;
  }

  setDashing(isDashing: boolean): void {
    this.isDashing = isDashing;

    if (isDashing) {
      this.sprite.setTint(DASH_TINT);
      this.sprite.setAlpha(DASH_ALPHA);
      return;
    }

    this.sprite.setAlpha(1);
  }

  syncFromState(state: PlayerState): void {
    this.sprite.setPosition(
      Math.round(state.position.x),
      Math.round(state.position.y),
    );

    if (state.velocity.x < 0) {
      this.facingDirection = -1;
      this.sprite.setFlipX(true);
    } else if (state.velocity.x > 0) {
      this.facingDirection = 1;
      this.sprite.setFlipX(false);
    }

    if (this.isDashing) {
      return;
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
