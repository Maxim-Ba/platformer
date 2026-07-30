## 1. Domain — validation rules

- [ ] 1.1 Create `src/domain/services/MapValidationRules.ts` — `validateUniqueDoorIds(room)`, `validateDoorTarget(maps, door, sourceRoomId)`, `validateBidirectionalPair(maps)` (returns warnings), `validateLayersAndTilesets(mapJson)`, `validateWorldGraph(graph, entryRoomId, mapIds)`
- [ ] 1.2 Define `MapValidationIssue` type: `{ level: 'error' | 'warning', roomId, message }`
- [ ] 1.3 Unit tests: `MapValidationRules.test.ts` — duplicate doorId, missing target, missing targetDoor, one-way pair warning, missing layer, graph room without file

## 2. Infrastructure — validator orchestration

- [ ] 2.1 Create `src/infrastructure/tiled/MapValidator.ts` — glob `public/assets/maps/*.json`, parse via `TiledLevelRepository.parseMap`, run all rules, return `MapValidationResult`
- [ ] 2.2 Reuse `TiledLevelRepository` (no duplicate JSON parsing logic)
- [ ] 2.3 Unit tests: `MapValidator.test.ts` — valid fixture set passes; broken fixture returns errors

## 3. CLI script

- [ ] 3.1 Create `scripts/validate-maps.mjs` — run validator, print per-file ✓/✗, summary, `process.exit(1)` on errors
- [ ] 3.2 Add `"validate:maps": "node scripts/validate-maps.mjs"` to `package.json`

## 4. Fix current assets (if needed)

- [ ] 4.1 Run `npm run validate:maps` against `level-01.json`, `room-a.json`, `room-b.json`
- [ ] 4.2 Fix any validation errors in maps or graph config

## 5. Documentation

- [ ] 5.1 Add validation section to `docs/level-authoring.md` — 6 rules, when to run, errors vs warnings
- [ ] 5.2 Add `npm run validate:maps` to README (Tiled workflow + quality gate)

## 6. Integration & quality

- [ ] 6.1 Run `npm run validate:maps`, `npm run test`, `npm run lint`, `npm run build`
- [ ] 6.2 Verify warnings for intentionally one-way door in test fixture; errors fail exit code
