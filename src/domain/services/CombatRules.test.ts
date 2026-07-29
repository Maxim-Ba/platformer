import { describe, expect, it } from 'vitest';

import {
  ATTACK_ACTIVE_MS,
  ATTACK_COOLDOWN_MS,
  ATTACK_HITBOX_HEIGHT,
  ATTACK_HITBOX_WIDTH,
} from '../constants/combat';
import { AttackState } from '../value-objects/AttackState';
import { CombatRules } from './CombatRules';

describe('CombatRules', () => {
  const rules = new CombatRules();

  it('blocks attack while on cooldown', () => {
    const state = new AttackState(ATTACK_COOLDOWN_MS, 0, 1);

    expect(rules.canStartAttack(state)).toBe(false);
  });

  it('blocks attack while active window is open', () => {
    const state = new AttackState(0, ATTACK_ACTIVE_MS, 1);

    expect(rules.canStartAttack(state)).toBe(false);
  });

  it('starts attack with configured timers and facing', () => {
    const state = AttackState.initial();

    const next = rules.startAttack(state, -1);

    expect(next.attackActiveMs).toBe(ATTACK_ACTIVE_MS);
    expect(next.cooldownRemainingMs).toBe(ATTACK_COOLDOWN_MS);
    expect(next.facingDirection).toBe(-1);
  });

  it('decays attack and cooldown timers over time', () => {
    const state = new AttackState(ATTACK_COOLDOWN_MS, ATTACK_ACTIVE_MS, 1);

    const next = rules.tick(state, 100);

    expect(next.attackActiveMs).toBe(ATTACK_ACTIVE_MS - 100);
    expect(next.cooldownRemainingMs).toBe(ATTACK_COOLDOWN_MS - 100);
  });

  it('offsets hitbox to the right when facing right', () => {
    const hitbox = rules.computeHitbox(100, 200, 1);

    expect(hitbox).toEqual({
      x: 112,
      y: 200 - ATTACK_HITBOX_HEIGHT,
      width: ATTACK_HITBOX_WIDTH,
      height: ATTACK_HITBOX_HEIGHT,
    });
  });

  it('offsets hitbox to the left when facing left', () => {
    const hitbox = rules.computeHitbox(100, 200, -1);

    expect(hitbox.x).toBe(100 - 12 - ATTACK_HITBOX_WIDTH);
    expect(hitbox.width).toBe(ATTACK_HITBOX_WIDTH);
  });

  it('detects overlap between hitbox and enemy AABB', () => {
    const hitbox = rules.computeHitbox(100, 200, 1);

    expect(rules.hitboxOverlapsAabb(hitbox, 130, 168, 32, 32)).toBe(true);
    expect(rules.hitboxOverlapsAabb(hitbox, 300, 168, 32, 32)).toBe(false);
  });

  it('reports attack active only while window is open', () => {
    expect(rules.isAttackActive(new AttackState(0, ATTACK_ACTIVE_MS, 1))).toBe(true);
    expect(rules.isAttackActive(AttackState.initial())).toBe(false);
  });
});
