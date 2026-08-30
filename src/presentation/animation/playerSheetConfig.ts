export const PLAYER_SHEET_FRAME_WIDTH = 172;
export const PLAYER_SHEET_FRAME_HEIGHT = 172;
export const PLAYER_IDLE_FRAME_COUNT = 8;
export const PLAYER_RUN_FRAME_COUNT = 6;
export const PLAYER_JUMP_FRAME_COUNT = 1;
export const PLAYER_FALL_FRAME_COUNT = 1;
export const PLAYER_ATTACK_FRAME_COUNT = 8;
export const PLAYER_DASH_FRAME_COUNT = 6;
export const PLAYER_HURT_FRAME_COUNT = 4;

export const PLAYER_ANIM_FRAME_RANGES = {
  idle: { start: 0, end: 7 },
  run: { start: 8, end: 13 },
  jump: { start: 14, end: 14 },
  fall: { start: 15, end: 15 },
  attack: { start: 16, end: 23 },
  dash: { start: 24, end: 29 },
  hurt: { start: 30, end: 33 },
} as const;
