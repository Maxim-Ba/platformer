import { describe, expect, it } from 'vitest';

import { PROJECTILE_LIFETIME_MS } from '../constants/projectiles';
import type { ProjectileState } from '../entities/ProjectileState';
import { Vector2 } from '../value-objects/Vector2';
import { ProjectileRules } from '../services/EnemyRules';

describe('ProjectileRules', () => {
  const rules = new ProjectileRules();

  const projectile: ProjectileState = {
    id: 'p-1',
    ownerEnemyId: 'caster-1',
    position: new Vector2(100, 200),
    velocity: new Vector2(200, 0),
    damage: 1,
    remainingMs: PROJECTILE_LIFETIME_MS,
  };

  it('moves projectile by velocity each tick', () => {
    const next = rules.move(projectile, 1000);

    expect(next.position.x).toBe(300);
    expect(next.remainingMs).toBe(PROJECTILE_LIFETIME_MS - 1000);
  });

  it('expires when lifetime reaches zero', () => {
    const next = rules.move(projectile, PROJECTILE_LIFETIME_MS);

    expect(rules.isExpired(next)).toBe(true);
  });

  it('detects overlap with player AABB', () => {
    expect(rules.overlapsPlayer(projectile, 100, 200)).toBe(true);
    expect(rules.overlapsPlayer(projectile, 0, 0)).toBe(false);
  });
});
