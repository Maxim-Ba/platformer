import {
  validateBidirectionalPair,
  validateDoorTarget,
  validateLayersAndTilesets,
  validateUniqueDoorIds,
  validateWorldGraph,
} from '@domain/services/MapValidationRules';
import type {
  MapFileValidationResult,
  MapValidationIssue,
  MapValidationResult,
} from '@domain/types/MapValidation';

import type { RoomDefinition } from '@domain/entities/RoomDefinition';
import type { TiledMapJson } from './TiledTypes';
import { TiledLevelRepository } from './TiledLevelRepository';

export interface ParsedMapFile {
  readonly fileName: string;
  readonly roomId: string;
  readonly mapJson: TiledMapJson;
  readonly room?: RoomDefinition;
  readonly parseError?: string;
}

export interface MapValidatorOptions {
  readonly mapsDirectory: string;
  readonly graphRoomIds: readonly string[];
  readonly entryRoomId: string;
}

function countByLevel(
  issues: readonly MapValidationIssue[],
  level: MapValidationIssue['level'],
): number {
  return issues.filter((entry) => entry.level === level).length;
}

export class MapValidator {
  private readonly repository = new TiledLevelRepository();

  constructor(private readonly options: MapValidatorOptions) {}

  validateFiles(files: readonly ParsedMapFile[]): MapValidationResult {
    const fileResults: MapFileValidationResult[] = [];
    const allIssues: MapValidationIssue[] = [];
    const maps = new Map<string, RoomDefinition>();
    const mapIds = new Set<string>();

    for (const file of files) {
      mapIds.add(file.roomId);

      if (file.parseError) {
        const issues = [
          {
            level: 'error' as const,
            roomId: file.roomId,
            message: file.parseError,
          },
        ];
        fileResults.push({
          fileName: file.fileName,
          roomId: file.roomId,
          passed: false,
          issues,
        });
        allIssues.push(...issues);
        continue;
      }

      if (!file.room) {
        continue;
      }

      maps.set(file.roomId, file.room);
    }

    for (const file of files) {
      if (file.parseError || !file.room) {
        continue;
      }

      const issues: MapValidationIssue[] = [
        ...validateLayersAndTilesets(file.roomId, {
          layers: file.mapJson.layers.map((layer) => ({
            name: layer.name,
            type: layer.type,
          })),
          tilesets: file.mapJson.tilesets.map((tileset) => ({ name: tileset.name })),
        }),
        ...validateUniqueDoorIds(file.room),
      ];

      for (const door of file.room.doors) {
        issues.push(...validateDoorTarget(maps, door, file.roomId));
      }

      const errors = countByLevel(issues, 'error');
      fileResults.push({
        fileName: file.fileName,
        roomId: file.roomId,
        passed: errors === 0,
        issues,
      });
      allIssues.push(...issues);
    }

    allIssues.push(...validateBidirectionalPair(maps));
    allIssues.push(
      ...validateWorldGraph(this.options.graphRoomIds, this.options.entryRoomId, mapIds),
    );

    const errorCount = countByLevel(allIssues, 'error');
    const warningCount = countByLevel(allIssues, 'warning');

    return {
      files: fileResults,
      issues: allIssues,
      errorCount,
      warningCount,
    };
  }

  parseMapFile(fileName: string, roomId: string, mapJson: TiledMapJson): ParsedMapFile {
    try {
      const room = this.repository.parseMap(roomId, mapJson);
      return { fileName, roomId, mapJson, room };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { fileName, roomId, mapJson, parseError: message };
    }
  }
}
