import type { AttributeId, DerivedStatId } from '@domain/types/player-stats';

export const ATTRIBUTE_LABELS: Record<AttributeId, string> = {
  strength: 'Сила',
  agility: 'Ловкость',
  intellect: 'Интеллект',
  luck: 'Удача',
  carryCapacity: 'Грузоподъёмность',
  vitality: 'Здоровье',
};

export const DERIVED_STAT_LABELS: Record<DerivedStatId, string> = {
  magicDefense: 'Магическая защита',
  maxHealth: 'Количество здоровья',
  maxEnergy: 'Количество энергии',
  maxMana: 'Количество маны',
  critChance: 'Шанс крит. удара',
  physicalDefense: 'Физическая защита',
  attackPower: 'Сила атаки',
  magicPower: 'Магическая сила',
};
