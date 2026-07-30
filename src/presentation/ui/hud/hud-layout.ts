import type Phaser from 'phaser';

export type HudAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const HUD_DEPTH = 100;

export const HUD_LAYOUT = {
  resources: { anchor: 'bottom-left' as const, x: 24, y: -24, lineHeight: 32 },
  score: { anchor: 'top-right' as const, x: -24, y: 24 },
  controls: { anchor: 'top-left' as const, x: 24, y: 24 },
  selectedSkills: { anchor: 'bottom-right' as const, x: -24, y: -24, lineHeight: 28 },
} as const;

export function resolveHudPosition(
  scene: Phaser.Scene,
  anchor: HudAnchor,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const { width, height } = scene.scale;

  switch (anchor) {
    case 'top-left':
      return { x: offsetX, y: offsetY };
    case 'top-right':
      return { x: width + offsetX, y: offsetY };
    case 'bottom-left':
      return { x: offsetX, y: height + offsetY };
    case 'bottom-right':
      return { x: width + offsetX, y: height + offsetY };
    default:
      return { x: offsetX, y: offsetY };
  }
}
