import { AssetKeys } from '@game/asset-keys';
import Phaser from 'phaser';

export const VFX_MELEE_SLASH_FRAME_COUNT = 4;
export const VFX_MELEE_SLASH_ANIM_KEY = 'vfx-melee-slash-play';

export function registerMeleeSlashAnimation(scene: Phaser.Scene): void {
  if (scene.anims.exists(VFX_MELEE_SLASH_ANIM_KEY)) {
    return;
  }

  scene.anims.create({
    key: VFX_MELEE_SLASH_ANIM_KEY,
    frames: scene.anims.generateFrameNumbers(AssetKeys.VfxMeleeSlash, {
      start: 0,
      end: VFX_MELEE_SLASH_FRAME_COUNT - 1,
    }),
    frameRate: 16,
    repeat: 0,
  });
}
