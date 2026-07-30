import type { AppDependencies } from '@game/composition-root';
import { getAppDependenciesFromRegistry } from '@game/scene-context';
import { createMenuInputHandler } from '@presentation/input/createMenuInputHandler';
import Phaser from 'phaser';

export interface MenuListItem {
  id: string;
  label: string;
}

export interface MenuList {
  destroy: () => void;
}

const SELECTED_COLOR = '#f8fafc';
const DEFAULT_COLOR = '#64748b';

export function createMenuList(
  scene: Phaser.Scene,
  items: readonly MenuListItem[],
  options: {
    x: number;
    y: number;
    lineHeight?: number;
    depth?: number;
    scrollFactor?: number;
    onSelect: (item: MenuListItem, index: number) => void;
  },
): MenuList {
  const lineHeight = options.lineHeight ?? 48;
  const scrollFactor = options.scrollFactor ?? 1;
  let selectedIndex = 0;
  const labels: Phaser.GameObjects.Text[] = [];

  const updateHighlight = (): void => {
    labels.forEach((label, index) => {
      label.setColor(index === selectedIndex ? SELECTED_COLOR : DEFAULT_COLOR);
    });
  };

  items.forEach((item, index) => {
    const label = scene.add
      .text(options.x, options.y + index * lineHeight, item.label, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: DEFAULT_COLOR,
      })
      .setOrigin(0.5)
      .setScrollFactor(scrollFactor);

    if (options.depth !== undefined) {
      label.setDepth(options.depth);
    }

    labels.push(label);
  });

  updateHighlight();

  const moveSelection = (delta: number): void => {
    if (items.length === 0) {
      return;
    }

    selectedIndex = (selectedIndex + delta + items.length) % items.length;
    updateHighlight();
  };

  const confirmSelection = (): void => {
    const item = items[selectedIndex];
    if (!item) {
      return;
    }

    options.onSelect(item, selectedIndex);
  };

  const menuInput = createMenuInputHandler(scene, {
    onUp: () => moveSelection(-1),
    onDown: () => moveSelection(1),
    onConfirm: confirmSelection,
  });

  return {
    destroy: () => {
      menuInput.destroy();
      labels.forEach((label) => label.destroy());
    },
  };
}

export function getMenuDependencies(scene: Phaser.Scene): AppDependencies {
  return getAppDependenciesFromRegistry(scene);
}
