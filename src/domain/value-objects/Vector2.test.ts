import { describe, expect, it } from 'vitest';

import { Vector2 } from './Vector2';

describe('Vector2', () => {
  it('adds two vectors component-wise', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);

    expect(a.add(b)).toEqual(new Vector2(4, 6));
  });
});
