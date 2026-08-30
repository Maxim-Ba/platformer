import { AssetKeys } from '@game/asset-keys';
import Phaser from 'phaser';

import { ENEMY_ANIM_FRAME_RANGES } from './enemySheetConfig';
import { toEnemyPhaserAnimKey } from './resolveEnemyAnimation';

function createFrameRange(
  textureKey: string,
  start: number,
  end: number,
): Phaser.Types.Animations.AnimationFrame[] {
  const frames: Phaser.Types.Animations.AnimationFrame[] = [];

  for (let frame = start; frame <= end; frame += 1) {
    frames.push({ key: textureKey, frame });
  }

  return frames;
}

export function registerEnemyAnimations(scene: Phaser.Scene): void {
  const definitions: Array<{
    textureKey: string;
    animationKey: 'idle' | 'walk' | 'fly' | 'attack';
    start: number;
    end: number;
    frameRate: number;
    repeat: number;
  }> = [
    {
      textureKey: AssetKeys.EnemyGrunt,
      animationKey: 'idle',
      ...ENEMY_ANIM_FRAME_RANGES.grunt.idle,
      frameRate: 8,
      repeat: -1,
    },
    {
      textureKey: AssetKeys.EnemyGrunt,
      animationKey: 'walk',
      ...ENEMY_ANIM_FRAME_RANGES.grunt.walk,
      frameRate: 10,
      repeat: -1,
    },
    {
      textureKey: AssetKeys.EnemyFlyer,
      animationKey: 'fly',
      ...ENEMY_ANIM_FRAME_RANGES.flyer.fly,
      frameRate: 10,
      repeat: -1,
    },
    {
      textureKey: AssetKeys.EnemyCaster,
      animationKey: 'idle',
      ...ENEMY_ANIM_FRAME_RANGES.caster.idle,
      frameRate: 8,
      repeat: -1,
    },
    {
      textureKey: AssetKeys.EnemyCaster,
      animationKey: 'attack',
      ...ENEMY_ANIM_FRAME_RANGES.caster.attack,
      frameRate: 10,
      repeat: 0,
    },
  ];

  for (const definition of definitions) {
    const key = toEnemyPhaserAnimKey(definition.textureKey, definition.animationKey);

    if (scene.anims.exists(key)) {
      continue;
    }

    scene.anims.create({
      key,
      frames: createFrameRange(definition.textureKey, definition.start, definition.end),
      frameRate: definition.frameRate,
      repeat: definition.repeat,
    });
  }
}
