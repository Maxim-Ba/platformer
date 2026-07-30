import type { ProjectileState } from '@domain/entities/ProjectileState';
import Phaser from 'phaser';

export class ProjectileSprite {
  readonly sprite: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.rectangle(x, y, 8, 8, 0xa855f7);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(4);
  }

  syncFromState(state: ProjectileState): void {
    this.sprite.setPosition(Math.round(state.position.x), Math.round(state.position.y));
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
