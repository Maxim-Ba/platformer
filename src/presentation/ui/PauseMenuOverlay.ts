import { HUD_DEPTH } from '@presentation/ui/hud/hud-layout';
import { createMenuList } from '@presentation/ui/MenuList';
import Phaser from 'phaser';

export const PAUSE_MENU_DEPTH = HUD_DEPTH + 25;

const DIM_ALPHA = 0.55;
const SAVE_FEEDBACK_DURATION_MS = 1500;

const MENU_ITEMS = [
  { id: 'settings', label: 'Настройки' },
  { id: 'save', label: 'Сохранить' },
  { id: 'checkpoint', label: 'Начать с контрольной точки' },
  { id: 'exit', label: 'Выход' },
] as const;

export interface PauseMenuOverlayCallbacks {
  onSettings: () => void;
  onSave: () => void;
  onCheckpoint: () => void;
  onExit: () => void;
}

export interface PauseMenuOverlay {
  destroy: () => void;
}

export function createPauseMenuOverlay(
  scene: Phaser.Scene,
  callbacks: PauseMenuOverlayCallbacks,
): PauseMenuOverlay {
  const { width, height } = scene.scale;
  const gameObjects: Phaser.GameObjects.GameObject[] = [];
  let saveFeedbackText: Phaser.GameObjects.Text | undefined;
  let saveFeedbackTimer: Phaser.Time.TimerEvent | undefined;

  const clearSaveFeedback = (): void => {
    saveFeedbackTimer?.remove();
    saveFeedbackTimer = undefined;
    saveFeedbackText?.destroy();
    saveFeedbackText = undefined;
  };

  const showSaveFeedback = (): void => {
    clearSaveFeedback();

    saveFeedbackText = scene.add
      .text(width / 2, height / 2 + 140, 'Сохранено', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#86efac',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(PAUSE_MENU_DEPTH + 2);

    saveFeedbackTimer = scene.time.delayedCall(SAVE_FEEDBACK_DURATION_MS, () => {
      clearSaveFeedback();
    });
  };

  const dim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, DIM_ALPHA)
    .setScrollFactor(0)
    .setDepth(PAUSE_MENU_DEPTH);

  const title = scene.add
    .text(width / 2, height / 2 - 120, 'Пауза', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#f8fafc',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(PAUSE_MENU_DEPTH + 1);

  gameObjects.push(dim, title);

  const menuList = createMenuList(scene, MENU_ITEMS, {
    x: width / 2,
    y: height / 2 - 20,
    depth: PAUSE_MENU_DEPTH + 1,
    scrollFactor: 0,
    onSelect: (item) => {
      if (item.id === 'settings') {
        callbacks.onSettings();
        return;
      }

      if (item.id === 'save') {
        callbacks.onSave();
        showSaveFeedback();
        return;
      }

      if (item.id === 'checkpoint') {
        callbacks.onCheckpoint();
        return;
      }

      if (item.id === 'exit') {
        callbacks.onExit();
      }
    },
  });

  return {
    destroy: () => {
      clearSaveFeedback();
      menuList.destroy();
      gameObjects.forEach((object) => object.destroy());
    },
  };
}
