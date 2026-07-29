## 1. Domain & port layer

- [ ] 1.1 Add `SkillCategory`, `SkillNodeDef`, `SkillTreeDefinition` types in `src/domain/types/SkillTree.ts`
- [ ] 1.2 Add static definitions for 3 trees (10 nodes each, levels 1→2→3→4) in `src/domain/constants/skill-trees.ts` with short RU labels
- [ ] 1.3 Add `MAX_SELECTED_SKILLS` constant and mock default unlock preset
- [ ] 1.4 Create `ISkillsPort` in `src/application/ports/ISkillsPort.ts`
- [ ] 1.5 Implement `InMemorySkillsAdapter` with unlock/selected state, slot limit, and `reset()`

## 2. Skills tab UI (character menu)

- [ ] 2.1 Create `SkillsTabPanel` with category selector (Физические / Энергетические / Магические)
- [ ] 2.2 Render tree nodes and parent-child links with locked/unlocked/selected visual states
- [ ] 2.3 Implement arrow-key focus navigation between nodes on skills tab
- [ ] 2.4 Wire Enter/Space (and optional click) to toggle select/deselect via `ISkillsPort`
- [ ] 2.5 Replace skills mock placeholder in `CharacterMenuOverlay` with `SkillsTabPanel`
- [ ] 2.6 When skills tab is active, route Left/Right arrows to tree navigation instead of menu tab switching

## 3. HUD selected skills widget

- [ ] 3.1 Add `selectedSkills` entry to `HUD_LAYOUT` (`bottom-right`, offset -24/-24)
- [ ] 3.2 Create `SelectedSkillsHudWidget` implementing `HudWidget` (up to 4 slots, empty slot marker)
- [ ] 3.3 Extend `GameHudDependencies` and `createGameHud` to compose selected skills widget
- [ ] 3.4 Update `relayout()` to position selected skills widget from layout config

## 4. Composition & session wiring

- [ ] 4.1 Instantiate `InMemorySkillsAdapter` in GameScene composition root (session-scoped)
- [ ] 4.2 Pass `skillsPort` into `createGameHud` and `CharacterMenuOverlay`
- [ ] 4.3 Call `skillsPort.reset()` from `StartNewGame` / level session reset alongside other ports

## 5. Verification

- [ ] 5.1 Manual: open **Скилы** tab — three categories, trees visible with correct level widths (1/2/3/4)
- [ ] 5.2 Manual: select unlocked nodes — bottom-right HUD updates; locked nodes reject selection
- [ ] 5.3 Manual: slot limit (4) enforced; deselect frees slot
- [ ] 5.4 Run `npm run lint` and `npm run build` from WSL
