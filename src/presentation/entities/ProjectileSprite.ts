import { PROJECTILE_HEIGHT, PROJECTILE_WIDTH } from '@domain/constants/projectiles';
import type { ProjectileState } from '@domain/entities/ProjectileState';
import { AssetKeys } from '@game/asset-keys';
import Phaser from 'phaser';

const PROJECTILE_DISPLAY_WIDTH = PROJECTILE_WIDTH * 2;
const PROJECTILE_DISPLAY_HEIGHT = PROJECTILE_HEIGHT * 2;

export class ProjectileSprite {
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.sprite(x, y, AssetKeys.ProjectileCaster);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDisplaySize(PROJECTILE_DISPLAY_WIDTH, PROJECTILE_DISPLAY_HEIGHT);
    this.sprite.setDepth(4);
  }

  syncFromState(state: ProjectileState): void {
    this.sprite.setPosition(Math.round(state.position.x), Math.round(state.position.y));
    this.sprite.setFlipX(state.velocity.x < 0);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
