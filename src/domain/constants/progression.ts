export const INITIAL_LEVEL = 1;
export const INITIAL_EXPERIENCE = 0;
export const XP_PER_LEVEL_MULTIPLIER = 100;

export const LEVEL_UNLOCKS: Readonly<Record<number, readonly string[]>> = {
  2: ['dash'],
  3: ['double_jump'],
};
