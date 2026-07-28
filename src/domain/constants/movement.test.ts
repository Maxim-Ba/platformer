import { describe, expect, it } from 'vitest';

import { GRAVITY, JUMP_VELOCITY, maxJumpHeight } from './movement';

/** level-01: ground (row 17) → floating platform (row 11), 6 tiles × 32 px */
const LEVEL_01_PLATFORM_STEP_PX = 6 * 32;

describe('movement constants', () => {
  it('reaches apex high enough for level-01 floating platform', () => {
    const height = maxJumpHeight();

    expect(height).toBeGreaterThanOrEqual(LEVEL_01_PLATFORM_STEP_PX);
    expect(height).toBeCloseTo((JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY), 5);
  });
});
