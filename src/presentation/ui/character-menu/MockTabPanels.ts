import type { CharacterMenuTabId } from '@game/character-menu-config';
import Phaser from 'phaser';

const MOCK_CONTENT: Record<CharacterMenuTabId, string> = {
  inventory: '[ Инвентарь ]\n\nСлоты предметов появятся здесь.\n(заглушка)',
  skills: '[ Скилы ]\n\nДерево навыков появится здесь.\n(заглушка)',
  stats: '[ Характеристики ]\n\nСила, ловкость, выносливость...\n(заглушка)',
  abilities: '[ Активные умения ]\n\nПанель умений появится здесь.\n(заглушка)',
  map: '[ Карта ]\n\nМини-карта уровня появится здесь.\n(заглушка)',
};

const PANEL_STYLE = {
  color: '#cbd5e1',
  fontFamily: 'monospace',
  fontSize: '24px',
  align: 'center' as const,
};

export function createMockTabPanel(
  scene: Phaser.Scene,
  tabId: CharacterMenuTabId,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x + width / 2, y + height / 2, MOCK_CONTENT[tabId], PANEL_STYLE)
    .setOrigin(0.5)
    .setWordWrapWidth(width - 48);
}
