import type { EnemyTypeId } from '@domain/entities/Enemy';
import { resolveArchetype } from '@domain/constants/enemies';
import type { EnemyState } from '@domain/entities/EnemyState';
import Phaser from 'phaser';

const ARCHETYPE_COLORS: Record<EnemyTypeId, number> = {
  grunt: 0xdc2626,
  flyer: 0x2563eb,
  caster: 0x9333ea,
};

export class EnemySprite {
  readonly sprite: Phaser.GameObjects.Rectangle;

  private constructor(
    scene: Phaser.Scene,
    archetypeId: EnemyTypeId,
    x: number,
    y: number,
  ) {
    const archetype = resolveArchetype(archetypeId);
    this.sprite = scene.add.rectangle(
      x,
      y,
      archetype.width,
      archetype.height,
      ARCHETYPE_COLORS[archetype.id],
    );
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(3);
  }

  static create(
    scene: Phaser.Scene,
    archetypeId: EnemyTypeId,
    x: number,
    y: number,
  ): EnemySprite {
    return new EnemySprite(scene, archetypeId, x, y);
  }

  syncFromState(state: EnemyState): void {
    this.sprite.setPosition(Math.round(state.position.x), Math.round(state.position.y));
    this.sprite.setScale(state.patrolDirection < 0 ? -1 : 1, 1);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
