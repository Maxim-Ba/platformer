import type Phaser from 'phaser';

import type { HudWidget } from './HudWidget';
import { HUD_DEPTH } from './hud-layout';

const CONTROLS_HINT_TEXT =
  'A/D or arrows — move, Space — jump, Esc — game over, I/K/C/U/M — character menu';

const DEFAULT_STYLE = {
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: '20px',
};

export function createControlsHintWidget(scene: Phaser.Scene): HudWidget {
  const text = scene.add
    .text(0, 0, CONTROLS_HINT_TEXT, DEFAULT_STYLE)
    .setScrollFactor(0)
    .setDepth(HUD_DEPTH);

  return {
    id: 'controls',
    update: () => {},
    setPosition: (x, y) => {
      text.setPosition(x, y);
    },
    destroy: () => {
      text.destroy();
    },
  };
}
