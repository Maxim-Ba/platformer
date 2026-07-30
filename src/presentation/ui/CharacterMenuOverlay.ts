import type { IPlayerStatsPort } from '@application/ports/IPlayerStatsPort';
import type { ISkillsPort } from '@application/ports/ISkillsPort';
import {
  CHARACTER_MENU_TABS,
  getTabByIndex,
  getTabIndex,
  type CharacterMenuTabId,
} from '@game/character-menu-config';
import { createMockTabPanel } from '@presentation/ui/character-menu/MockTabPanels';
import { createSkillsTabPanel } from '@presentation/ui/character-menu/SkillsTabPanel';
import { createStatsTabPanel } from '@presentation/ui/character-menu/StatsTabPanel';
import { createMenuInputHandler } from '@presentation/input/createMenuInputHandler';
import { HUD_DEPTH } from '@presentation/ui/hud/hud-layout';
import { createTabBar } from '@presentation/ui/TabBar';
import Phaser from 'phaser';

export const CHARACTER_MENU_DEPTH = HUD_DEPTH + 50;

const PANEL_WIDTH = 1400;
const PANEL_HEIGHT = 800;
const PANEL_COLOR = 0x0f172a;
const PANEL_ALPHA = 0.92;
const DIM_ALPHA = 0.55;
const TAB_BAR_HEIGHT = 48;
const CONTENT_PADDING = 32;
const TAB_BAR_DEPTH = CHARACTER_MENU_DEPTH + 2;

interface TabPanelHandle {
  setVisible: (visible: boolean) => void;
  handleKeyDown?: (event: KeyboardEvent) => boolean;
  destroy: () => void;
}

export interface CharacterMenuOverlay {
  setActiveTab: (tabId: CharacterMenuTabId) => void;
  getActiveTab: () => CharacterMenuTabId;
  destroy: () => void;
}

export interface CharacterMenuOverlayOptions {
  statsPort: IPlayerStatsPort;
  skillsPort: ISkillsPort;
}

export function createCharacterMenuOverlay(
  scene: Phaser.Scene,
  options: CharacterMenuOverlayOptions,
): CharacterMenuOverlay {
  const { statsPort, skillsPort } = options;
  const { width, height } = scene.scale;
  const panelX = (width - PANEL_WIDTH) / 2;
  const panelY = (height - PANEL_HEIGHT) / 2;
  const contentY = panelY + TAB_BAR_HEIGHT + CONTENT_PADDING;
  const contentHeight = PANEL_HEIGHT - TAB_BAR_HEIGHT - CONTENT_PADDING * 2;
  const contentWidth = PANEL_WIDTH - CONTENT_PADDING * 2;

  const gameObjects: Phaser.GameObjects.GameObject[] = [];

  const dim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, DIM_ALPHA)
    .setScrollFactor(0)
    .setDepth(CHARACTER_MENU_DEPTH);

  const panel = scene.add
    .rectangle(panelX + PANEL_WIDTH / 2, panelY + PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR, PANEL_ALPHA)
    .setScrollFactor(0)
    .setDepth(CHARACTER_MENU_DEPTH + 1);

  const title = scene.add
    .text(panelX + CONTENT_PADDING, panelY + 16, 'Персонаж', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#f8fafc',
    })
    .setScrollFactor(0)
    .setDepth(TAB_BAR_DEPTH);

  gameObjects.push(dim, panel, title);

  const tabPanels = new Map<CharacterMenuTabId, TabPanelHandle>();

  for (const tab of CHARACTER_MENU_TABS) {
    if (tab.id === 'stats') {
      const statsPanel = createStatsTabPanel(
        scene,
        statsPort,
        panelX + CONTENT_PADDING,
        contentY,
        contentWidth,
        contentHeight,
        TAB_BAR_DEPTH,
      );
      statsPanel.setVisible(false);
      tabPanels.set(tab.id, statsPanel);
      continue;
    }

    if (tab.id === 'skills') {
      const skillsPanel = createSkillsTabPanel(
        scene,
        skillsPort,
        panelX + CONTENT_PADDING,
        contentY,
        contentWidth,
        contentHeight,
        TAB_BAR_DEPTH,
      );
      skillsPanel.setVisible(false);
      tabPanels.set(tab.id, skillsPanel);
      continue;
    }

    const mockPanel = createMockTabPanel(
      scene,
      tab.id,
      panelX + CONTENT_PADDING,
      contentY,
      contentWidth,
      contentHeight,
    );
    mockPanel.setScrollFactor(0).setDepth(TAB_BAR_DEPTH).setVisible(false);
    tabPanels.set(tab.id, {
      setVisible: (visible) => mockPanel.setVisible(visible),
      destroy: () => mockPanel.destroy(),
    });
  }

  let activeTabId: CharacterMenuTabId = CHARACTER_MENU_TABS[0]!.id;

  const showActivePanel = (): void => {
    tabPanels.forEach((panelObject, tabId) => {
      panelObject.setVisible(tabId === activeTabId);
    });
  };

  const tabBar = createTabBar(
    scene,
    CHARACTER_MENU_TABS.map((tab) => ({ id: tab.id, label: tab.label })),
    {
      x: panelX,
      y: panelY + 56,
      width: PANEL_WIDTH,
      depth: TAB_BAR_DEPTH,
      scrollFactor: 0,
      onTabChange: (_index, item) => {
        activeTabId = item.id as CharacterMenuTabId;
        showActivePanel();
      },
    },
  );

  const setActiveTab = (tabId: CharacterMenuTabId): void => {
    activeTabId = tabId;
    tabBar.setActiveTab(getTabIndex(tabId));
    showActivePanel();
  };

  const moveTab = (delta: number): void => {
    const currentIndex = getTabIndex(activeTabId);
    const nextTab = getTabByIndex(currentIndex + delta);
    setActiveTab(nextTab.id);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (activeTabId === 'skills') {
      const skillsPanel = tabPanels.get('skills');
      if (skillsPanel?.handleKeyDown?.(event)) {
        return;
      }
    }
  };

  const menuInput = createMenuInputHandler(scene, {
    onLeft: () => moveTab(-1),
    onRight: () => moveTab(1),
  });

  window.addEventListener('keydown', onKeyDown);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    window.removeEventListener('keydown', onKeyDown);
  });

  setActiveTab(activeTabId);

  return {
    setActiveTab,
    getActiveTab: () => activeTabId,
    destroy: () => {
      menuInput.destroy();
      window.removeEventListener('keydown', onKeyDown);
      tabBar.destroy();
      tabPanels.forEach((panel) => panel.destroy());
      gameObjects.forEach((object) => object.destroy());
    },
  };
}
