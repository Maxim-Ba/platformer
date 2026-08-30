import { describe, expect, it } from 'vitest';

import { PLAYER_ANIM_FRAME_RANGES, PLAYER_ATTACK_FRAME_COUNT } from './playerSheetConfig';

describe('playerSheetConfig', () => {
  it('gives attack a full melee cycle of at least 6 frames', () => {
    expect(PLAYER_ATTACK_FRAME_COUNT).toBeGreaterThanOrEqual(6);
    expect(
      PLAYER_ANIM_FRAME_RANGES.attack.end - PLAYER_ANIM_FRAME_RANGES.attack.start + 1,
    ).toBeGreaterThanOrEqual(6);
  });
});
