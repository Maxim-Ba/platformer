import type { EnemyTypeId } from '@domain/entities/Enemy';
import { resolveArchetype } from '@domain/constants/enemies';
import type { EnemyState } from '@domain/entities/EnemyState';
import Phaser from 'phaser';

import {
  type EnemyAnimationResolveContext,
  resolveEnemyAnimation,
  toEnemyPhaserAnimKey,
} from '@presentation/animation/resolveEnemyAnimation';

export class EnemySprite {
  readonly sprite: Phaser.GameObjects.Sprite;
  private currentAnim: string | null = null;

  private constructor(
    scene: Phaser.Scene,
    private readonly archetypeId: EnemyTypeId,
    x: number,
    y: number,
  ) {
    const archetype = resolveArchetype(archetypeId);
    this.sprite = scene.add.sprite(x, y, archetype.spriteKey);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(archetype.width, archetype.height);
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

  syncFromState(state: EnemyState, context?: EnemyAnimationResolveContext): void {
    const archetype = resolveArchetype(this.archetypeId);
    this.sprite.setPosition(Math.round(state.position.x), Math.round(state.position.y));
    this.sprite.setFlipX(state.patrolDirection < 0);

    const animationKey = resolveEnemyAnimation(state, archetype, context);
    const phaserAnimKey = toEnemyPhaserAnimKey(archetype.spriteKey, animationKey);

    if (this.currentAnim !== phaserAnimKey) {
      this.sprite.play(phaserAnimKey, true);
      this.currentAnim = phaserAnimKey;
    }

    this.sprite.setDisplaySize(archetype.width, archetype.height);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
