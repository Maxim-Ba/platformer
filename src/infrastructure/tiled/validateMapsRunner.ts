import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WORLD_ENTRY_ROOM_ID, WORLD_GRAPH } from '@game/world-graph';

import type { TiledMapJson } from './TiledTypes';
import { MapValidator } from './MapValidator';
import { formatValidationReport, hasValidationErrors } from './validateMapsCli';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const mapsDirectory = path.join(projectRoot, 'public/assets/maps');

function listMapFiles(): string[] {
  return fs
    .readdirSync(mapsDirectory)
    .filter((entry) => entry.endsWith('.json'))
    .sort();
}

function main(): void {
  const validator = new MapValidator({
    mapsDirectory,
    graphRoomIds: Object.keys(WORLD_GRAPH),
    entryRoomId: WORLD_ENTRY_ROOM_ID,
  });

  const parsedFiles = listMapFiles().map((fileName) => {
    const roomId = path.basename(fileName, '.json');
    const raw = fs.readFileSync(path.join(mapsDirectory, fileName), 'utf8');
    const mapJson = JSON.parse(raw) as TiledMapJson;
    return validator.parseMapFile(fileName, roomId, mapJson);
  });

  const result = validator.validateFiles(parsedFiles);
  console.log(formatValidationReport(result));

  if (hasValidationErrors(result)) {
    process.exit(1);
  }
}

main();
