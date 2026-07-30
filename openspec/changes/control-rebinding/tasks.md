## 1. Domain — каталог действий и схема настроек

- [ ] 1.1 Добавить `InputActionId`, `GamepadBinding` и расширить `GameSettings.controls` (`keyBindings: string | string[]`, опциональный `gamepadBindings`)
- [ ] 1.2 Создать `input-actions.ts` и `input-action-labels.ts` с полным набором действий и дефолтными биндингами (включая A/D, Shift/L, J/X)
- [ ] 1.3 Обновить `DEFAULT_SETTINGS` и bump `SETTINGS_VERSION` при необходимости
- [ ] 1.4 Расширить `SettingsRules`: валидация action ids, уникальность key codes, merge `gamepadBindings`
- [ ] 1.5 Добавить unit-тесты `SettingsRules` для ребиндинга, конфликтов и reset

## 2. Infrastructure — settings-aware input

- [ ] 2.1 Рефакторинг `PhaserInputAdapter`: принимать `getControls()` callback, читать биндинги для move/jump/dash/attack
- [ ] 2.2 Добавить helper `normalizeKeyCodes()` в domain или infrastructure для `string | string[]`
- [ ] 2.3 Обновить `composition-root.ts`: передать settings accessor в input adapter

## 3. Presentation — GameScene hotkeys

- [ ] 3.1 Заменить hardcoded Esc и I/K/C/U/M в `GameScene` на чтение `controls.keyBindings`
- [ ] 3.2 Добавить helper `isActionJustDown(codes)` для system hotkeys

## 4. Presentation — Settings UI

- [ ] 4.1 Добавить пункт «Управление» в список SettingsScene
- [ ] 4.2 Реализовать sub-screen со списком действий, listen mode и отменой по Escape
- [ ] 4.3 Добавить `formatKeyCode()` для отображения клавиш в UI
- [ ] 4.4 Реализовать «Сброс по умолчанию» и сообщение о конфликте клавиш
- [ ] 4.5 Обновить footer-подсказки SettingsScene для обоих уровней навигации

## 5. Presentation — HUD

- [ ] 5.1 Обновить `ControlsHintWidget` для динамического текста из текущих биндингов
- [ ] 5.2 Подключить обновление hint при возврате из SettingsScene в GameScene

## 6. Verification

- [ ] 6.1 Ручной тест: ребиндинг из главного меню, сохранение после reload
- [ ] 6.2 Ручной тест: ребиндинг из паузы, return context сохраняется
- [ ] 6.3 Запустить `npm test` и `npm run lint`
