import type { PlayerState } from '@domain/value-objects/PlayerState';
import Phaser from 'phaser';

const PLAYER_TEXTURE_KEY = 'player';
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 56;

function ensurePlayerTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAYER_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0x22c55e, 1);
  graphics.fillRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
  graphics.generateTexture(PLAYER_TEXTURE_KEY, PLAYER_WIDTH, PLAYER_HEIGHT);
  graphics.destroy();
}

export class PlayerSprite {
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ensurePlayerTexture(scene);
    this.sprite = scene.add.sprite(x, y, PLAYER_TEXTURE_KEY);
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
