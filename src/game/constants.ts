export const PLAYER_ENTITY_ID = 'player';

export const REGISTRY_APP_DEPENDENCIES_KEY = 'appDependencies';

export const DEFAULT_LEVEL_ID = 'level-01';

export const DEFAULT_ROOM_ID = 'room-a';

export const LEVEL_PROGRESSION: readonly string[] = ['level-01'] as const;

export function getNextLevelId(currentLevelId: string): string | undefined {
  const index = LEVEL_PROGRESSION.indexOf(currentLevelId);
  if (index === -1 || index >= LEVEL_PROGRESSION.length - 1) {
    return undefined;
  }

  return LEVEL_PROGRESSION[index + 1];
}
