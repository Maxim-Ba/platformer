import type { InputActionId } from '../types/InputActionId';

export const INPUT_ACTION_LABELS: Record<InputActionId, string> = {
  moveLeft: 'Влево',
  moveRight: 'Вправо',
  jump: 'Прыжок',
  dash: 'Рывок',
  attack: 'Атака',
  pause: 'Пауза',
  charMenuInventory: 'Меню: инвентарь',
  charMenuSkills: 'Меню: навыки',
  charMenuStats: 'Меню: характеристики',
  charMenuUpgrades: 'Меню: улучшения',
  charMenuMap: 'Меню: карта',
};
