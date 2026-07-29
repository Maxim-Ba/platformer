## 1. Configuration

- [ ] 1.1 Create `src/game/character-menu-config.ts` with tab definitions (id, label, key code) for all five tabs
- [ ] 1.2 Export `CharacterMenuTabId` type and lookup helpers (`getTabByKey`, `getTabIndex`)

## 2. UI Components

- [ ] 2.1 Create `src/presentation/ui/TabBar.ts` — horizontal tab bar with active/inactive highlight
- [ ] 2.2 Create `src/presentation/ui/character-menu/MockTabPanels.ts` — placeholder panels for all five tabs
- [ ] 2.3 Create `src/presentation/ui/CharacterMenuOverlay.ts` — fullscreen dim + panel + TabBar + content area
- [ ] 2.4 Wire Left/Right arrow navigation in overlay (wrap-around between tabs)
- [ ] 2.5 Ensure overlay uses `setScrollFactor(0)` and depth above HUD

## 3. GameScene Integration

- [ ] 3.1 Add `isCharacterMenuOpen` flag and `characterMenuOverlay` ref to `GameScene`
- [ ] 3.2 Register hotkeys (`I`, `K`, `C`, `U`, `M`) in `create()` via Phaser keyboard
- [ ] 3.3 Implement `openCharacterMenu(tabId)` / `closeCharacterMenu()` / `toggleCharacterMenuTab(tabId)`
- [ ] 3.4 Extend `update()` freeze guard to include `isCharacterMenuOpen` (movement, damage, camera, ticks)
- [ ] 3.5 Handle Esc to close character menu when open
- [ ] 3.6 Block character menu during `isRespawning` and `isCompleting` transitions
- [ ] 3.7 Destroy overlay and remove listeners on scene shutdown

## 4. HUD & Documentation

- [ ] 4.1 Update `ControlsHintWidget` to document character menu hotkeys (`I/K/C/U/M`)
- [ ] 4.2 Update README controls section with character menu hotkeys

## 5. Verification

- [ ] 5.1 Manual test: each hotkey opens menu on correct tab
- [ ] 5.2 Manual test: Left/Right arrows switch tabs with wrap-around
- [ ] 5.3 Manual test: Esc and same-hotkey close menu, gameplay resumes
- [ ] 5.4 Manual test: gameplay frozen while menu open (no movement, no damage)
- [ ] 5.5 Run `npm run lint` and `npm run build`
