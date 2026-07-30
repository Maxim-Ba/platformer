import type Phaser from 'phaser';

import { INPUT_ACTION_LABELS } from '@domain/constants/input-action-labels';
import type { GameSettings } from '@domain/types/GameSettings';
import type { InputActionId } from '@domain/types/InputActionId';

import type { HudWidget } from './HudWidget';
import { HUD_DEPTH } from './hud-layout';
import { formatKeyBinding, formatKeyCode } from '@presentation/input/formatKeyCode';

const GAMEPLAY_ACTION_IDS: readonly InputActionId[] = [
  'moveLeft',
  'moveRight',
  'jump',
  'dash',
  'attack',
  'interact',
  'pause',
];

const CHAR_MENU_ACTION_IDS: readonly InputActionId[] = [
  'charMenuInventory',
  'charMenuSkills',
  'charMenuStats',
  'charMenuUpgrades',
  'charMenuMap',
];

const DEFAULT_STYLE = {
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: '20px',
};

function buildControlsHintText(controls: GameSettings['controls']): string {
  const gameplayParts = GAMEPLAY_ACTION_IDS.map((actionId) => {
    const label = INPUT_ACTION_LABELS[actionId];
    const keys = formatKeyBinding(controls.keyBindings[actionId]);
    return `${keys} — ${label}`;
  });

  const charMenuKeys = CHAR_MENU_ACTION_IDS
    .map((actionId) => formatKeyCode(normalizePrimaryCode(controls.keyBindings[actionId])))
    .join('/');

  return `KB: ${gameplayParts.join(', ')} | ${charMenuKeys} — character menu | Pad: stick/D-pad — move, A — jump, Y — dash, X — attack, RB — interact, Start — pause, Back — character menu, LB/RB — tabs`;
}

function normalizePrimaryCode(binding: string | string[]): string {
  return Array.isArray(binding) ? binding[0]! : binding;
}

export function createControlsHintWidget(
  scene: Phaser.Scene,
  getControls: () => GameSettings['controls'],
): HudWidget {
  const text = scene.add
    .text(0, 0, buildControlsHintText(getControls()), DEFAULT_STYLE)
    .setScrollFactor(0)
    .setDepth(HUD_DEPTH);

  return {
    id: 'controls',
    update: () => {
      text.setText(buildControlsHintText(getControls()));
    },
    setPosition: (x, y) => {
      text.setPosition(x, y);
    },
    destroy: () => {
      text.destroy();
    },
  };
}
