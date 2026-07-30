import type { EnemyState } from '../entities/EnemyState';
import type { AttackTickResult } from './types';

export function contactAttackBehavior(state: EnemyState): AttackTickResult {
  return {
    state,
    spawnedProjectiles: [],
  };
}
