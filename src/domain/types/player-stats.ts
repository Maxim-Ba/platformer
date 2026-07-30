export type AttributeId =
  | 'strength'
  | 'agility'
  | 'intellect'
  | 'luck'
  | 'carryCapacity'
  | 'vitality';

export type DerivedStatId =
  | 'magicDefense'
  | 'maxHealth'
  | 'maxEnergy'
  | 'maxMana'
  | 'critChance'
  | 'physicalDefense'
  | 'attackPower'
  | 'magicPower';

export const ATTRIBUTE_IDS: readonly AttributeId[] = [
  'strength',
  'agility',
  'intellect',
  'luck',
  'carryCapacity',
  'vitality',
] as const;

export const DERIVED_STAT_IDS: readonly DerivedStatId[] = [
  'magicDefense',
  'maxHealth',
  'maxEnergy',
  'maxMana',
  'critChance',
  'physicalDefense',
  'attackPower',
  'magicPower',
] as const;

export const MIN_ATTRIBUTE_VALUE = 1;
export const MAX_ATTRIBUTE_VALUE = 99;

export class PlayerAttributes {
  constructor(
    readonly strength: number,
    readonly agility: number,
    readonly intellect: number,
    readonly luck: number,
    readonly carryCapacity: number,
    readonly vitality: number,
  ) {}

  static mockInitial(): PlayerAttributes {
    return new PlayerAttributes(10, 8, 6, 5, 10, 10);
  }

  getValue(id: AttributeId): number {
    switch (id) {
      case 'strength':
        return this.strength;
      case 'agility':
        return this.agility;
      case 'intellect':
        return this.intellect;
      case 'luck':
        return this.luck;
      case 'carryCapacity':
        return this.carryCapacity;
      case 'vitality':
        return this.vitality;
    }
  }

  withAttribute(id: AttributeId, value: number): PlayerAttributes {
    switch (id) {
      case 'strength':
        return new PlayerAttributes(value, this.agility, this.intellect, this.luck, this.carryCapacity, this.vitality);
      case 'agility':
        return new PlayerAttributes(this.strength, value, this.intellect, this.luck, this.carryCapacity, this.vitality);
      case 'intellect':
        return new PlayerAttributes(this.strength, this.agility, value, this.luck, this.carryCapacity, this.vitality);
      case 'luck':
        return new PlayerAttributes(this.strength, this.agility, this.intellect, value, this.carryCapacity, this.vitality);
      case 'carryCapacity':
        return new PlayerAttributes(this.strength, this.agility, this.intellect, this.luck, value, this.vitality);
      case 'vitality':
        return new PlayerAttributes(this.strength, this.agility, this.intellect, this.luck, this.carryCapacity, value);
    }
  }
}

export class DerivedStats {
  constructor(
    readonly magicDefense: number,
    readonly maxHealth: number,
    readonly maxEnergy: number,
    readonly maxMana: number,
    readonly critChance: number,
    readonly physicalDefense: number,
    readonly attackPower: number,
    readonly magicPower: number,
  ) {}

  getValue(id: DerivedStatId): number {
    switch (id) {
      case 'magicDefense':
        return this.magicDefense;
      case 'maxHealth':
        return this.maxHealth;
      case 'maxEnergy':
        return this.maxEnergy;
      case 'maxMana':
        return this.maxMana;
      case 'critChance':
        return this.critChance;
      case 'physicalDefense':
        return this.physicalDefense;
      case 'attackPower':
        return this.attackPower;
      case 'magicPower':
        return this.magicPower;
    }
  }
}

export class PlayerStatsState {
  constructor(
    readonly attributes: PlayerAttributes,
    readonly unallocatedPoints: number,
  ) {}
}
