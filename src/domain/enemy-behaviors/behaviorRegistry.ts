import type { AttackBehaviorId, MovementBehaviorId } from '../entities/Enemy';
import { contactAttackBehavior } from './contactAttackBehavior';
import { flyHoverBehavior } from './flyHoverBehavior';
import { groundPatrolBehavior } from './groundPatrolBehavior';
import { rangedCastBehavior } from './rangedCastBehavior';
import type { AttackBehavior, MovementBehavior } from './types';

export const MOVEMENT_BEHAVIORS: Record<MovementBehaviorId, MovementBehavior> = {
  'ground-patrol': groundPatrolBehavior,
  'fly-hover': flyHoverBehavior,
};

export const ATTACK_BEHAVIORS: Record<AttackBehaviorId, AttackBehavior> = {
  contact: (state, ctx, archetype) => {
    void ctx;
    void archetype;
    return contactAttackBehavior(state);
  },
  'ranged-cast': (state, ctx, archetype) => {
    void archetype;
    return rangedCastBehavior(state, ctx);
  },
};

export function getMovementBehavior(id: MovementBehaviorId): MovementBehavior {
  return MOVEMENT_BEHAVIORS[id];
}

export function getAttackBehavior(id: AttackBehaviorId): AttackBehavior {
  return ATTACK_BEHAVIORS[id];
}
