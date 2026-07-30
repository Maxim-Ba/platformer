import type { IPlayerStatsPort } from '@application/ports/IPlayerStatsPort';
import { ATTRIBUTE_LABELS, DERIVED_STAT_LABELS } from '@domain/constants/player-stats-labels';
import {
  ATTRIBUTE_IDS,
  DERIVED_STAT_IDS,
  MAX_ATTRIBUTE_VALUE,
  MIN_ATTRIBUTE_VALUE,
  type AttributeId,
  type DerivedStatId,
} from '@domain/types/player-stats';
import Phaser from 'phaser';

const TEXT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '20px',
  color: '#cbd5e1',
};

const HEADER_STYLE = {
  fontFamily: 'monospace',
  fontSize: '22px',
  color: '#f8fafc',
};

const BUTTON_HIT_SIZE = 32;

interface AttributeRowControls {
  id: AttributeId;
  valueText: Phaser.GameObjects.Text;
  increaseButton: Phaser.GameObjects.Text;
  decreaseButton: Phaser.GameObjects.Text;
}

interface DerivedStatRowControls {
  id: DerivedStatId;
  valueText: Phaser.GameObjects.Text;
}

export interface StatsTabPanel {
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

function formatDerivedValue(id: DerivedStatId, value: number): string {
  if (id === 'critChance') {
    return `${value}%`;
  }

  return String(value);
}

function createInteractiveButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#38bdf8',
      backgroundColor: '#1e293b',
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  button.setSize(BUTTON_HIT_SIZE, BUTTON_HIT_SIZE);
  button.on('pointerup', onClick);

  return button;
}

function setButtonEnabled(button: Phaser.GameObjects.Text, enabled: boolean): void {
  if (enabled) {
    button.setAlpha(1);
    button.setInteractive({ useHandCursor: true });
    return;
  }

  button.setAlpha(0.35);
  button.disableInteractive();
}

export function createStatsTabPanel(
  scene: Phaser.Scene,
  statsPort: IPlayerStatsPort,
  x: number,
  y: number,
  width: number,
  _height: number,
  depth: number,
): StatsTabPanel {
  const gameObjects: Phaser.GameObjects.Text[] = [];
  const leftColumnWidth = Math.floor(width * 0.45);
  const rightColumnX = x + leftColumnWidth + 24;
  const rightColumnWidth = width - leftColumnWidth - 24;
  const rowHeight = 40;
  const columnStartY = y + 56;

  const unallocatedPointsText = scene.add
    .text(x, y, '', HEADER_STYLE)
    .setScrollFactor(0)
    .setDepth(depth);
  gameObjects.push(unallocatedPointsText);

  const attributesHeader = scene.add
    .text(x, y + 32, 'АТРИБУТЫ', HEADER_STYLE)
    .setScrollFactor(0)
    .setDepth(depth);
  gameObjects.push(attributesHeader);

  const parametersHeader = scene.add
    .text(rightColumnX, y + 32, 'ПАРАМЕТРЫ', HEADER_STYLE)
    .setScrollFactor(0)
    .setDepth(depth);
  gameObjects.push(parametersHeader);

  const attributeRows: AttributeRowControls[] = [];

  ATTRIBUTE_IDS.forEach((id, index) => {
    const rowY = columnStartY + index * rowHeight;
    const labelText = scene.add
      .text(x, rowY, ATTRIBUTE_LABELS[id], TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(depth);
    gameObjects.push(labelText);

    const valueText = scene.add
      .text(x + 220, rowY, '0', TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(depth);
    gameObjects.push(valueText);

    const increaseButton = createInteractiveButton(scene, x + 310, rowY, '[+]', () => {
      if (statsPort.increaseAttribute(id)) {
        refreshDisplay();
      }
    });
    increaseButton.setScrollFactor(0).setDepth(depth);
    gameObjects.push(increaseButton);

    const decreaseButton = createInteractiveButton(scene, x + 360, rowY, '[−]', () => {
      if (statsPort.decreaseAttribute(id)) {
        refreshDisplay();
      }
    });
    decreaseButton.setScrollFactor(0).setDepth(depth);
    gameObjects.push(decreaseButton);

    attributeRows.push({ id, valueText, increaseButton, decreaseButton });
  });

  const derivedStatRows: DerivedStatRowControls[] = [];

  DERIVED_STAT_IDS.forEach((id, index) => {
    const rowY = columnStartY + index * rowHeight;
    const labelText = scene.add
      .text(rightColumnX, rowY, DERIVED_STAT_LABELS[id], TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(depth);
    gameObjects.push(labelText);

    const valueText = scene.add
      .text(rightColumnX + rightColumnWidth - 80, rowY, '0', TEXT_STYLE)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    gameObjects.push(valueText);

    derivedStatRows.push({ id, valueText });
  });

  const refreshDisplay = (): void => {
    const attributes = statsPort.getAttributes();
    const unallocatedPoints = statsPort.getUnallocatedPoints();
    const derivedStats = statsPort.getDerivedStats();

    unallocatedPointsText.setText(`Нераспределённые очки: ${unallocatedPoints}`);

    attributeRows.forEach(({ id, valueText, increaseButton, decreaseButton }) => {
      const value = attributes.getValue(id);
      valueText.setText(String(value));

      const canIncrease = unallocatedPoints > 0 && value < MAX_ATTRIBUTE_VALUE;
      const canDecrease = value > MIN_ATTRIBUTE_VALUE;

      setButtonEnabled(increaseButton, canIncrease);
      setButtonEnabled(decreaseButton, canDecrease);
    });

    derivedStatRows.forEach(({ id, valueText }) => {
      const value = derivedStats.getValue(id);
      valueText.setText(formatDerivedValue(id, value));
    });
  };

  refreshDisplay();

  return {
    setVisible: (visible: boolean) => {
      gameObjects.forEach((object) => object.setVisible(visible));
    },
    destroy: () => {
      gameObjects.forEach((object) => object.destroy());
    },
  };
}
