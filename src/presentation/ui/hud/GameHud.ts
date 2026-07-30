import type { IEnergyPort } from '@application/ports/IEnergyPort';
import type { IHealthPort } from '@application/ports/IHealthPort';
import type { IManaPort } from '@application/ports/IManaPort';
import type { IProgressionPort } from '@application/ports/IProgressionPort';
import type { ISkillsPort } from '@application/ports/ISkillsPort';
import type { GameSettings } from '@domain/types/GameSettings';
import type Phaser from 'phaser';

import { createControlsHintWidget } from './ControlsHintWidget';
import type { HudWidget } from './HudWidget';
import { HUD_LAYOUT, resolveHudPosition } from './hud-layout';
import { createResourceHudWidget } from './ResourceHudWidget';
import { createScoreHudWidget } from './ScoreHudWidget';
import { createSelectedSkillsHudWidget } from './SelectedSkillsHudWidget';

export interface GameHudDependencies {
  healthPort: IHealthPort;
  manaPort: IManaPort;
  energyPort: IEnergyPort;
  progressionPort: IProgressionPort;
  skillsPort: ISkillsPort;
  getControls: () => GameSettings['controls'];
}

export interface GameHud {
  update(): void;
  destroy(): void;
  relayout(): void;
}

function positionWidgets(
  scene: Phaser.Scene,
  widgets: readonly HudWidget[],
  layout: {
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    x: number;
    y: number;
    lineHeight?: number;
  },
): void {
  const position = resolveHudPosition(scene, layout.anchor, layout.x, layout.y);
  const lineHeight = layout.lineHeight ?? 0;

  widgets.forEach((widget, index) => {
    const lineFromBottom = widgets.length - 1 - index;
    widget.setPosition(position.x, position.y - lineFromBottom * lineHeight);
  });
}

export function createGameHud(scene: Phaser.Scene, deps: GameHudDependencies): GameHud {
  const controlsWidget = createControlsHintWidget(scene, deps.getControls);
  const resourceWidgets = [
    createResourceHudWidget(scene, {
      id: 'health',
      label: 'HP',
      getValue: () => deps.healthPort.getHealth(),
      format: (state) => `${state.currentHp}/${state.maxHp}`,
    }),
    createResourceHudWidget(scene, {
      id: 'mana',
      label: 'Mana',
      getValue: () => deps.manaPort.getMana(),
      format: (state) => `${state.current}/${state.max}`,
    }),
    createResourceHudWidget(scene, {
      id: 'energy',
      label: 'Energy',
      getValue: () => deps.energyPort.getEnergy(),
      format: (state) => `${state.current}/${state.max}`,
    }),
  ];
  const scoreWidget = createScoreHudWidget(scene, deps.progressionPort);
  const selectedSkillsWidget = createSelectedSkillsHudWidget(scene, {
    skillsPort: deps.skillsPort,
  });

  const widgets: HudWidget[] = [controlsWidget, ...resourceWidgets, scoreWidget, selectedSkillsWidget];

  const relayout = (): void => {
    const controlsPosition = resolveHudPosition(
      scene,
      HUD_LAYOUT.controls.anchor,
      HUD_LAYOUT.controls.x,
      HUD_LAYOUT.controls.y,
    );
    controlsWidget.setPosition(controlsPosition.x, controlsPosition.y);
    positionWidgets(scene, resourceWidgets, HUD_LAYOUT.resources);
    const scorePosition = resolveHudPosition(
      scene,
      HUD_LAYOUT.score.anchor,
      HUD_LAYOUT.score.x,
      HUD_LAYOUT.score.y,
    );
    scoreWidget.setPosition(scorePosition.x, scorePosition.y);
    const selectedSkillsPosition = resolveHudPosition(
      scene,
      HUD_LAYOUT.selectedSkills.anchor,
      HUD_LAYOUT.selectedSkills.x,
      HUD_LAYOUT.selectedSkills.y,
    );
    selectedSkillsWidget.setPosition(selectedSkillsPosition.x, selectedSkillsPosition.y);
  };

  relayout();

  return {
    update: () => {
      widgets.forEach((widget) => widget.update());
    },
    destroy: () => {
      widgets.forEach((widget) => widget.destroy());
    },
    relayout,
  };
}
