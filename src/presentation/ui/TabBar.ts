import Phaser from 'phaser';

export interface TabBarItem {
  id: string;
  label: string;
}

export interface TabBar {
  setActiveTab: (index: number) => void;
  getActiveIndex: () => number;
  destroy: () => void;
}

const SELECTED_COLOR = '#f8fafc';
const DEFAULT_COLOR = '#64748b';

export function createTabBar(
  scene: Phaser.Scene,
  items: readonly TabBarItem[],
  options: {
    x: number;
    y: number;
    width: number;
    fontSize?: string;
    depth?: number;
    scrollFactor?: number;
    onTabChange?: (index: number, item: TabBarItem) => void;
  },
): TabBar {
  const fontSize = options.fontSize ?? '22px';
  let activeIndex = 0;
  const labels: Phaser.GameObjects.Text[] = [];
  const tabWidth = items.length > 0 ? options.width / items.length : options.width;

  const updateHighlight = (): void => {
    labels.forEach((label, index) => {
      label.setColor(index === activeIndex ? SELECTED_COLOR : DEFAULT_COLOR);
    });
  };

  items.forEach((item, index) => {
    const label = scene.add
      .text(options.x + tabWidth * (index + 0.5), options.y, item.label, {
        fontFamily: 'monospace',
        fontSize,
        color: DEFAULT_COLOR,
      })
      .setOrigin(0.5, 0);

    if (options.depth !== undefined) {
      label.setDepth(options.depth);
    }
    if (options.scrollFactor !== undefined) {
      label.setScrollFactor(options.scrollFactor);
    }

    labels.push(label);
  });

  updateHighlight();

  const setActiveTab = (index: number): void => {
    if (items.length === 0) {
      return;
    }

    activeIndex = ((index % items.length) + items.length) % items.length;
    updateHighlight();

    const item = items[activeIndex];
    if (item) {
      options.onTabChange?.(activeIndex, item);
    }
  };

  return {
    setActiveTab,
    getActiveIndex: () => activeIndex,
    destroy: () => {
      labels.forEach((label) => label.destroy());
    },
  };
}
