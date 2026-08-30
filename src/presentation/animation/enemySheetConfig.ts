export const ENEMY_GRUNT_SHEET_FRAME_WIDTH = 86;
export const ENEMY_GRUNT_SHEET_FRAME_HEIGHT = 86;
export const ENEMY_FLYER_SHEET_FRAME_WIDTH = 86;
export const ENEMY_FLYER_SHEET_FRAME_HEIGHT = 86;
export const ENEMY_CASTER_SHEET_FRAME_WIDTH = 170;
export const ENEMY_CASTER_SHEET_FRAME_HEIGHT = 170;

export const ENEMY_ANIM_FRAME_RANGES = {
  grunt: {
    idle: { start: 0, end: 7 },
    walk: { start: 8, end: 15 },
  },
  flyer: {
    fly: { start: 0, end: 7 },
  },
  caster: {
    idle: { start: 0, end: 7 },
    attack: { start: 8, end: 15 },
  },
} as const;
