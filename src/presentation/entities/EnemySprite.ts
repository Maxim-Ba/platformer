import type { EnemyState } from '@domain/entities/EnemyState';
import Phaser from 'phaser';

export class EnemySprite {
  readonly sprite: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.rectangle(x, y, 32, 48, 0xdc2626);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(3);
  }

  syncFromState(state: EnemyState): void {
    this.sprite.setPosition(Math.round(state.position.x), Math.round(state.position.y));
    this.sprite.setScale(state.patrolDirection < 0 ? -1 : 1, 1);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
