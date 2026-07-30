import type { EnemyArchetype, EnemyTypeId } from '../entities/Enemy';
import type { EnemySpawn } from '../entities/LevelDefinition';
import type { EnemyState } from '../entities/EnemyState';

export const ENEMY_ARCHETYPES: Record<EnemyTypeId, EnemyArchetype> = {
  grunt: {
    id: 'grunt',
    maxHp: 2,
    width: 32,
    height: 48,
    speed: 60,
    killXp: 25,
    movementBehaviorId: 'ground-patrol',
    attackBehaviorId: 'contact',
    spriteKey: 'enemy-grunt',
    defaultPatrolDistance: 120,
  },
  flyer: {
    id: 'flyer',
    maxHp: 1,
    width: 24,
    height: 24,
    speed: 80,
    killXp: 30,
    movementBehaviorId: 'fly-hover',
    attackBehaviorId: 'contact',
    spriteKey: 'enemy-flyer',
    defaultPatrolDistance: 160,
  },
  caster: {
    id: 'caster',
    maxHp: 2,
    width: 28,
    height: 40,
    speed: 60,
    killXp: 40,
    movementBehaviorId: 'ground-patrol',
    attackBehaviorId: 'ranged-cast',
    spriteKey: 'enemy-caster',
    defaultPatrolDistance: 0,
  },
};

const UNKNOWN_TYPE_WARNING =
  '[enemies] Unknown enemyType "%s" — falling back to grunt archetype';

export function resolveArchetype(typeId: string): EnemyArchetype {
  if (typeId in ENEMY_ARCHETYPES) {
    return ENEMY_ARCHETYPES[typeId as EnemyTypeId];
  }

  console.warn(UNKNOWN_TYPE_WARNING.replace('%s', typeId));
  return ENEMY_ARCHETYPES.grunt;
}

export function getDefaultPatrolDistance(archetype: EnemyArchetype): number {
  return archetype.defaultPatrolDistance;
}

export function createEnemyFromSpawn(spawn: EnemySpawn): EnemyState {
  const archetype = resolveArchetype(spawn.enemyType);
  const patrolDistance = spawn.patrolDistance ?? archetype.defaultPatrolDistance;
  const spawnX = spawn.position.x;

  return {
    id: spawn.id,
    archetypeId: archetype.id,
    position: spawn.position,
    hp: archetype.maxHp,
    patrolDirection: 1,
    patrolMinX: spawnX - patrolDistance,
    patrolMaxX: spawnX + patrolDistance,
    behaviorTimerMs: 0,
    hoverCenterY: spawn.position.y,
  };
}

/** Для smoke-теста extensibility: spawn с явным archetype без правок consumers */
export function createEnemyFromSpawnWithArchetype(
  spawn: EnemySpawn,
  archetype: EnemyArchetype,
): EnemyState {
  const patrolDistance = spawn.patrolDistance ?? archetype.defaultPatrolDistance;
  const spawnX = spawn.position.x;

  return {
    id: spawn.id,
    archetypeId: archetype.id,
    position: spawn.position,
    hp: archetype.maxHp,
    patrolDirection: 1,
    patrolMinX: spawnX - patrolDistance,
    patrolMaxX: spawnX + patrolDistance,
    behaviorTimerMs: 0,
    hoverCenterY: spawn.position.y,
  };
}

export function createTestArchetype(overrides: Partial<EnemyArchetype> & Pick<EnemyArchetype, 'id'>): EnemyArchetype {
  const base = ENEMY_ARCHETYPES.grunt;
  return { ...base, ...overrides };
}
