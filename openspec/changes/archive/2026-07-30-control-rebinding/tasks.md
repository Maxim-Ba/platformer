## 1. Domain — каталог действий и схема настроек

- [x] 1.1 Добавить `InputActionId`, `GamepadBinding` и расширить `GameSettings.controls` (`keyBindings: string | string[]`, опциональный `gamepadBindings`)
- [x] 1.2 Создать `input-actions.ts` и `input-action-labels.ts` с полным набором действий и дефолтными биндингами (включая A/D, Shift/L, J/X)
- [x] 1.3 Обновить `DEFAULT_SETTINGS` и bump `SETTINGS_VERSION` при необходимости
- [x] 1.4 Расширить `SettingsRules`: валидация action ids, уникальность key codes, merge `gamepadBindings`
- [x] 1.5 Добавить unit-тесты `SettingsRules` для ребиндинга, конфликтов и reset

## 2. Infrastructure — settings-aware input

- [x] 2.1 Рефакторинг `PhaserInputAdapter`: принимать `getControls()` callback, читать биндинги для move/jump/dash/attack
- [x] 2.2 Добавить helper `normalizeKeyCodes()` в domain или infrastructure для `string | string[]`
- [x] 2.3 Обновить `composition-root.ts`: передать settings accessor в input adapter

## 3. Presentation — GameScene hotkeys

- [x] 3.1 Заменить hardcoded Esc и I/K/C/U/M в `GameScene` на чтение `controls.keyBindings`
- [x] 3.2 Добавить helper `isActionJustDown(codes)` для system hotkeys

## 4. Presentation — Settings UI

- [x] 4.1 Добавить пункт «Управление» в список SettingsScene
- [x] 4.2 Реализовать sub-screen со списком действий, listen mode и отменой по Escape
- [x] 4.3 Добавить `formatKeyCode()` для отображения клавиш в UI
- [x] 4.4 Реализовать «Сброс по умолчанию» и сообщение о конфликте клавиш
- [x] 4.5 Обновить footer-подсказки SettingsScene для обоих уровней навигации

## 5. Presentation — HUD

- [x] 5.1 Обновить `ControlsHintWidget` для динамического текста из текущих биндингов
- [x] 5.2 Подключить обновление hint при возврате из SettingsScene в GameScene

## 6. Verification

- [x] 6.1 Ручной тест: ребиндинг из главного меню, сохранение после reload
- [x] 6.2 Ручной тест: ребиндинг из паузы, return context сохраняется
- [x] 6.3 Ручной тест: после `LoadGame` биндинги не сбрасываются (settings и game save — разные ключи localStorage)
- [x] 6.4 Запустить `npm test` и `npm run lint`
