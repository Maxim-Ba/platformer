import type { ISettingsPort } from '@application/ports/ISettingsPort';
import { AssetKeys, PlayerAnimKeys } from '@game/asset-keys';
import Phaser from 'phaser';

import { PLAYER_ANIM_FRAME_RANGES } from './playerSheetConfig';

export {
  PLAYER_ANIM_FRAME_RANGES,
  PLAYER_ATTACK_FRAME_COUNT,
  PLAYER_FALL_FRAME_COUNT,
  PLAYER_IDLE_FRAME_COUNT,
  PLAYER_JUMP_FRAME_COUNT,
  PLAYER_RUN_FRAME_COUNT,
  PLAYER_SHEET_FRAME_HEIGHT,
  PLAYER_SHEET_FRAME_WIDTH,
} from './playerSheetConfig';

export function resolvePlayerTextureKey(settingsPort?: ISettingsPort): string {
  const skinId = settingsPort?.getSettings().cosmetics.playerSkinId ?? 'default';
  return skinId === 'default' ? AssetKeys.PlayerSheet : `player-sheet-${skinId}`;
}

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

export function registerPlayerAnimations(
  scene: Phaser.Scene,
  textureKey: string,
): void {
  const definitions: Array<{
    key: string;
    start: number;
    end: number;
    frameRate: number;
    repeat: number;
  }> = [
    {
      key: PlayerAnimKeys.Idle,
      ...PLAYER_ANIM_FRAME_RANGES.idle,
      frameRate: 8,
      repeat: -1,
    },
    {
      key: PlayerAnimKeys.Run,
      ...PLAYER_ANIM_FRAME_RANGES.run,
      frameRate: 10,
      repeat: -1,
    },
    {
      key: PlayerAnimKeys.Jump,
      ...PLAYER_ANIM_FRAME_RANGES.jump,
      frameRate: 1,
      repeat: 0,
    },
    {
      key: PlayerAnimKeys.Fall,
      ...PLAYER_ANIM_FRAME_RANGES.fall,
      frameRate: 1,
      repeat: 0,
    },
    {
      key: PlayerAnimKeys.Attack,
      ...PLAYER_ANIM_FRAME_RANGES.attack,
      frameRate: 12,
      repeat: 0,
    },
  ];

  for (const definition of definitions) {
    if (scene.anims.exists(definition.key)) {
      continue;
    }

    scene.anims.create({
      key: definition.key,
      frames: createFrameRange(textureKey, definition.start, definition.end),
      frameRate: definition.frameRate,
      repeat: definition.repeat,
    });
  }
}

export function toPhaserAnimKey(animationKey: string): string {
  return `player-${animationKey}`;
}
