import Phaser from 'phaser';

export type CharacterMenuTabId = 'inventory' | 'skills' | 'stats' | 'abilities' | 'map';

export interface CharacterMenuTabDefinition {
  id: CharacterMenuTabId;
  label: string;
  keyCode: number;
}

export const CHARACTER_MENU_TABS: readonly CharacterMenuTabDefinition[] = [
  { id: 'inventory', label: 'Инвентарь', keyCode: Phaser.Input.Keyboard.KeyCodes.I },
  { id: 'skills', label: 'Скилы', keyCode: Phaser.Input.Keyboard.KeyCodes.K },
  { id: 'stats', label: 'Характеристики', keyCode: Phaser.Input.Keyboard.KeyCodes.C },
  { id: 'abilities', label: 'Активные умения', keyCode: Phaser.Input.Keyboard.KeyCodes.U },
  { id: 'map', label: 'Карта', keyCode: Phaser.Input.Keyboard.KeyCodes.M },
] as const;

export function getTabByKey(keyCode: number): CharacterMenuTabDefinition | undefined {
  return CHARACTER_MENU_TABS.find((tab) => tab.keyCode === keyCode);
}

export function getTabIndex(tabId: CharacterMenuTabId): number {
  const index = CHARACTER_MENU_TABS.findIndex((tab) => tab.id === tabId);
  return index >= 0 ? index : 0;
}

export function getTabByIndex(index: number): CharacterMenuTabDefinition {
  const tab = CHARACTER_MENU_TABS[index];
  if (!tab) {
    return CHARACTER_MENU_TABS[0]!;
  }
  return tab;
}
