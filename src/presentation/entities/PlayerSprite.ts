import type { PlayerState } from '@domain/value-objects/PlayerState';
import type { ISettingsPort } from '@application/ports/ISettingsPort';
import Phaser from 'phaser';

import {
  resolvePlayerTextureKey,
  toPhaserAnimKey,
} from '@presentation/animation/PlayerAnimationRegistry';
import {
  type AnimationResolveContext,
  resolvePlayerAnimation,
} from '@presentation/animation/resolvePlayerAnimation';

const DASH_TINT = 0x88ccff;
const DASH_ALPHA = 0.6;
const PLAYER_DISPLAY_WIDTH = 32;
const PLAYER_DISPLAY_HEIGHT = 48;

export class PlayerSprite {
  readonly sprite: Phaser.GameObjects.Sprite;
  private facingDirection: -1 | 1 = 1;
  private isDashing = false;
  private currentAnim: string | null = null;
  private readonly textureKey: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    settingsPort?: ISettingsPort,
  ) {
    this.textureKey = resolvePlayerTextureKey(settingsPort);
    this.sprite = scene.add.sprite(x, y, this.textureKey);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
  }

  setFacing(direction: -1 | 1): void {
    this.facingDirection = direction;
    this.sprite.setFlipX(direction < 0);
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
    this.sprite.clearTint();
  }

  syncFromState(state: PlayerState, context?: AnimationResolveContext): void {
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

    const animationKey = resolvePlayerAnimation(state, context);
    const phaserAnimKey = toPhaserAnimKey(animationKey);

    if (this.currentAnim !== phaserAnimKey) {
      this.sprite.play(phaserAnimKey, true);
      this.currentAnim = phaserAnimKey;
    }
  }
}
