## 1. Configuration

- [x] 1.1 Create `src/game/character-menu-config.ts` with tab definitions (id, label, key code) for all five tabs
- [x] 1.2 Export `CharacterMenuTabId` type and lookup helpers (`getTabByKey`, `getTabIndex`)

## 2. UI Components

- [x] 2.1 Create `src/presentation/ui/TabBar.ts` — horizontal tab bar with active/inactive highlight
- [x] 2.2 Create `src/presentation/ui/character-menu/MockTabPanels.ts` — placeholder panels for all five tabs
- [x] 2.3 Create `src/presentation/ui/CharacterMenuOverlay.ts` — fullscreen dim + panel + TabBar + content area
- [x] 2.4 Wire Left/Right arrow navigation in overlay (wrap-around between tabs)
- [x] 2.5 Ensure overlay uses `setScrollFactor(0)` and depth above HUD

## 3. GameScene Integration

- [x] 3.1 Add `isCharacterMenuOpen` flag and `characterMenuOverlay` ref to `GameScene`
- [x] 3.2 Register hotkeys (`I`, `K`, `C`, `U`, `M`) in `create()` via Phaser keyboard
- [x] 3.3 Implement `openCharacterMenu(tabId)` / `closeCharacterMenu()` / `toggleCharacterMenuTab(tabId)`
- [x] 3.4 Extend `update()` freeze guard to include `isCharacterMenuOpen` (movement, damage, camera, ticks)
- [x] 3.5 Handle Esc to close character menu when open
- [x] 3.6 Block character menu during `isRespawning` and `isCompleting` transitions
- [x] 3.7 Destroy overlay and remove listeners on scene shutdown

## 4. HUD & Documentation

- [x] 4.1 Update `ControlsHintWidget` to document character menu hotkeys (`I/K/C/U/M`)
- [x] 4.2 Update README controls section with character menu hotkeys

## 5. Verification

- [x] 5.1 Manual test: each hotkey opens menu on correct tab
- [x] 5.2 Manual test: Left/Right arrows switch tabs with wrap-around
- [x] 5.3 Manual test: Esc and same-hotkey close menu, gameplay resumes
- [x] 5.4 Manual test: gameplay frozen while menu open (no movement, no damage)
- [x] 5.5 Run `npm run lint` and `npm run build`
