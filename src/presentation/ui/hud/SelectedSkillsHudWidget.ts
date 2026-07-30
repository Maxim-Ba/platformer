import type { ISkillsPort } from '@application/ports/ISkillsPort';
import { getSkillNodeLabel } from '@domain/constants/skill-trees';
import type Phaser from 'phaser';

import type { HudWidget } from './HudWidget';
import { HUD_DEPTH } from './hud-layout';

const DEFAULT_STYLE = {
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: '18px',
};

export interface SelectedSkillsHudWidgetOptions {
  skillsPort: ISkillsPort;
}

export function createSelectedSkillsHudWidget(
  scene: Phaser.Scene,
  options: SelectedSkillsHudWidgetOptions,
): HudWidget {
  const { skillsPort } = options;
  const text = scene.add
    .text(0, 0, '', DEFAULT_STYLE)
    .setOrigin(1, 1)
    .setScrollFactor(0)
    .setDepth(HUD_DEPTH);

  const update = (): void => {
    const selectedIds = skillsPort.getSelectedNodeIds();
    const maxSlots = skillsPort.getMaxSelectedSlots();
    const slots: string[] = [];

    for (let index = 0; index < maxSlots; index += 1) {
      const nodeId = selectedIds[index];
      if (nodeId) {
        slots.push(getSkillNodeLabel(nodeId));
      } else {
        slots.push('—');
      }
    }

    text.setText(slots.join(' | '));
  };

  update();

  return {
    id: 'selectedSkills',
    update,
    setPosition: (x, y) => {
      text.setPosition(x, y);
    },
    destroy: () => {
      text.destroy();
    },
  };
}
