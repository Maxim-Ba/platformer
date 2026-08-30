import fs from 'node:fs';

const w = 24;
const h = 12;
const ground = [];
const decorA = [];
const decorB = [];
const decorC = [];
const decorD = [];

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    ground.push(y >= 10 ? 1 : 0);
    decorA.push(y >= 8 && y < 10 && x >= 4 && x < 10 ? 2 : 0);
    decorB.push(y >= 8 && y < 10 && x >= 14 && x < 20 ? 2 : 0);
    decorC.push(y >= 8 && y < 10 && x >= 8 && x < 16 ? 2 : 0);
    const inGruntZone = x >= 8 && x < 11;
    const inFlyerZone = x >= 14 && x < 17;
    const inCasterZone = x >= 20 && x < 23;
    decorD.push(y >= 8 && y < 10 && (inGruntZone || inFlyerZone || inCasterZone) ? 2 : 0);
  }
}

function loadTilesets() {
  const candidates = ['public/assets/maps/room-a.json', 'public/assets/maps/level-01.json'];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
    if (Array.isArray(parsed.tilesets) && parsed.tilesets.length > 0) {
      return parsed.tilesets;
    }
  }
  throw new Error(
    'Need a Tiled JSON with tilesets (public/assets/maps/room-a.json or level-01.json)',
  );
}

const tilesets = loadTilesets();

function makeMap(decor, objects) {
  return {
    compressionlevel: -1,
    height: h,
    infinite: false,
    layers: [
      {
        data: ground,
        height: h,
        id: 1,
        name: 'ground',
        opacity: 1,
        properties: [{ name: 'solid', type: 'bool', value: false }],
        type: 'tilelayer',
        visible: true,
        width: w,
        x: 0,
        y: 0,
      },
      {
        data: decor,
        height: h,
        id: 2,
        name: 'decor',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width: w,
        x: 0,
        y: 0,
      },
      {
        draworder: 'topdown',
        id: 3,
        name: 'objects',
        objects,
        opacity: 1,
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 4,
    nextobjectid: 20,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.12.2',
    tileheight: 32,
    tilesets,
    tilewidth: 32,
    type: 'map',
    version: '1.10',
    width: w,
  };
}

const roomA = makeMap(decorA, [
  {
    height: 32,
    id: 1,
    name: 'Player Spawn',
    type: 'player_spawn',
    visible: true,
    width: 32,
    x: 96,
    y: 288,
  },
  {
    height: 64,
    id: 2,
    name: 'Boundary to B',
    type: 'boundary_exit',
    visible: true,
    width: 32,
    x: 736,
    y: 256,
    properties: [
      { name: 'exitId', type: 'string', value: 'to-b' },
      { name: 'targetRoom', type: 'string', value: 'room-b' },
      { name: 'targetExitId', type: 'string', value: 'from-a' },
      { name: 'edge', type: 'string', value: 'right' },
      { name: 'facing', type: 'string', value: 'left' },
    ],
  },
  {
    height: 64,
    id: 3,
    name: 'Boundary to C',
    type: 'boundary_exit',
    visible: true,
    width: 64,
    x: 352,
    y: 320,
    properties: [
      { name: 'exitId', type: 'string', value: 'to-c' },
      { name: 'targetRoom', type: 'string', value: 'room-c' },
      { name: 'targetExitId', type: 'string', value: 'from-a' },
      { name: 'edge', type: 'string', value: 'bottom' },
      { name: 'facing', type: 'string', value: 'right' },
    ],
  },
  {
    height: 64,
    id: 4,
    name: 'Door to B (interior)',
    type: 'door',
    visible: true,
    width: 32,
    x: 320,
    y: 256,
    properties: [
      { name: 'doorId', type: 'string', value: 'interior-to-b' },
      { name: 'targetRoom', type: 'string', value: 'room-b' },
      { name: 'targetDoor', type: 'string', value: 'interior-from-a' },
      { name: 'facing', type: 'string', value: 'right' },
    ],
  },
  {
    height: 64,
    id: 10,
    name: 'Door to D (enemy arena)',
    type: 'door',
    visible: true,
    width: 32,
    x: 192,
    y: 256,
    properties: [
      { name: 'doorId', type: 'string', value: 'to-d' },
      { name: 'targetRoom', type: 'string', value: 'room-d' },
      { name: 'targetDoor', type: 'string', value: 'from-a' },
      { name: 'facing', type: 'string', value: 'right' },
    ],
  },
]);

const roomB = makeMap(decorB, [
  {
    height: 32,
    id: 5,
    name: 'Player Spawn',
    type: 'player_spawn',
    visible: true,
    width: 32,
    x: 384,
    y: 288,
  },
  {
    height: 64,
    id: 6,
    name: 'Boundary from A',
    type: 'boundary_exit',
    visible: true,
    width: 32,
    x: 0,
    y: 256,
    properties: [
      { name: 'exitId', type: 'string', value: 'from-a' },
      { name: 'targetRoom', type: 'string', value: 'room-a' },
      { name: 'targetExitId', type: 'string', value: 'to-b' },
      { name: 'edge', type: 'string', value: 'left' },
      { name: 'facing', type: 'string', value: 'right' },
    ],
  },
  {
    height: 64,
    id: 7,
    name: 'Door from A (interior)',
    type: 'door',
    visible: true,
    width: 32,
    x: 480,
    y: 256,
    properties: [
      { name: 'doorId', type: 'string', value: 'interior-from-a' },
      { name: 'targetRoom', type: 'string', value: 'room-a' },
      { name: 'targetDoor', type: 'string', value: 'interior-to-b' },
      { name: 'facing', type: 'string', value: 'left' },
    ],
  },
]);

const roomC = makeMap(decorC, [
  {
    height: 32,
    id: 8,
    name: 'Player Spawn',
    type: 'player_spawn',
    visible: true,
    width: 32,
    x: 384,
    y: 288,
  },
  {
    height: 64,
    id: 9,
    name: 'Boundary from A',
    type: 'boundary_exit',
    visible: true,
    width: 64,
    x: 352,
    y: 0,
    properties: [
      { name: 'exitId', type: 'string', value: 'from-a' },
      { name: 'targetRoom', type: 'string', value: 'room-a' },
      { name: 'targetExitId', type: 'string', value: 'to-c' },
      { name: 'edge', type: 'string', value: 'top' },
      { name: 'facing', type: 'string', value: 'right' },
    ],
  },
]);

const roomD = makeMap(decorD, [
  {
    height: 32,
    id: 1,
    name: 'Player Spawn',
    type: 'player_spawn',
    visible: true,
    width: 32,
    x: 96,
    y: 288,
  },
  {
    height: 64,
    id: 2,
    name: 'Door from A',
    type: 'door',
    visible: true,
    width: 32,
    x: 64,
    y: 256,
    properties: [
      { name: 'doorId', type: 'string', value: 'from-a' },
      { name: 'targetRoom', type: 'string', value: 'room-a' },
      { name: 'targetDoor', type: 'string', value: 'to-d' },
      { name: 'facing', type: 'string', value: 'right' },
    ],
  },
  {
    height: 32,
    id: 3,
    name: 'Grunt Enemy',
    type: 'enemy_spawn',
    visible: true,
    width: 32,
    x: 288,
    y: 288,
    properties: [
      { name: 'enemyType', type: 'string', value: 'grunt' },
      { name: 'patrolDistance', type: 'int', value: 80 },
    ],
  },
  {
    height: 24,
    id: 4,
    name: 'Flyer Enemy',
    type: 'enemy_spawn',
    visible: true,
    width: 24,
    x: 432,
    y: 128,
    properties: [
      { name: 'enemyType', type: 'string', value: 'flyer' },
      { name: 'patrolDistance', type: 'int', value: 120 },
    ],
  },
  {
    height: 40,
    id: 5,
    name: 'Caster Enemy',
    type: 'enemy_spawn',
    visible: true,
    width: 28,
    x: 592,
    y: 280,
    properties: [
      { name: 'enemyType', type: 'string', value: 'caster' },
      { name: 'patrolDistance', type: 'int', value: 0 },
    ],
  },
]);

fs.writeFileSync('public/assets/maps/room-a.json', JSON.stringify(roomA, null, 2));
fs.writeFileSync('public/assets/maps/room-b.json', JSON.stringify(roomB, null, 2));
fs.writeFileSync('public/assets/maps/room-c.json', JSON.stringify(roomC, null, 2));
fs.writeFileSync('public/assets/maps/room-d.json', JSON.stringify(roomD, null, 2));
