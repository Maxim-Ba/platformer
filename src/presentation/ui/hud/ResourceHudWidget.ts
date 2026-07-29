import type Phaser from 'phaser';

import type { HudWidget } from './HudWidget';
import { HUD_DEPTH } from './hud-layout';

const DEFAULT_STYLE = {
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: '20px',
};

export interface ResourceHudWidgetOptions<T> {
  id: string;
  label: string;
  getValue: () => T;
  format: (value: T) => string;
}

export function createResourceHudWidget<T>(
  scene: Phaser.Scene,
  options: ResourceHudWidgetOptions<T>,
): HudWidget {
  const text = scene.add
    .text(0, 0, '', DEFAULT_STYLE)
    .setScrollFactor(0)
    .setDepth(HUD_DEPTH);

  const update = (): void => {
    text.setText(`${options.label}: ${options.format(options.getValue())}`);
  };

  update();

  return {
    id: options.id,
    update,
    setPosition: (x, y) => {
      text.setPosition(x, y);
    },
    destroy: () => {
      text.destroy();
    },
  };
}
