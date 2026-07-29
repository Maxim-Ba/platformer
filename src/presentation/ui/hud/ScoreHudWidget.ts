import type { IProgressionPort } from '@application/ports/IProgressionPort';
import type Phaser from 'phaser';

import type { HudWidget } from './HudWidget';
import { HUD_DEPTH } from './hud-layout';

const DEFAULT_STYLE = {
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: '20px',
};

export function createScoreHudWidget(
  scene: Phaser.Scene,
  progressionPort: IProgressionPort,
): HudWidget {
  const text = scene.add
    .text(0, 0, '', DEFAULT_STYLE)
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(HUD_DEPTH);

  const update = (): void => {
    const { level, experience } = progressionPort.getProgression();
    text.setText(`Level ${level}  XP ${experience}`);
  };

  update();

  return {
    id: 'score',
    update,
    setPosition: (x, y) => {
      text.setPosition(x, y);
    },
    destroy: () => {
      text.destroy();
    },
  };
}
