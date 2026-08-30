import { describe, expect, it } from 'vitest';

import { containSize } from './containSize';

describe('containSize', () => {
  it('fits a square source into a taller box without stretching', () => {
    expect(containSize(64, 64, 32, 64)).toEqual({ width: 32, height: 32 });
  });

  it('fits a square source into a wider box without stretching', () => {
    expect(containSize(64, 64, 96, 32)).toEqual({ width: 32, height: 32 });
  });
});
