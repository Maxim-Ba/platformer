export const WORLD_ENTRY_ROOM_ID = 'room-a';

export const WORLD_GRAPH = {
  'room-a': { displayName: 'Room A (West)' },
  'room-b': { displayName: 'Room B (East)' },
  'room-c': { displayName: 'Room C (South)' },
  'room-d': { displayName: 'Room D (Enemy Arena)' },
} as const;

/** When true, new game starts in the mock room world instead of legacy level-01. */
export const WORLD_PLAYTEST_ENABLED = true;
