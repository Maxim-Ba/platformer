import { INPUT_ACTION_IDS } from '@domain/constants/input-actions';
import { INPUT_ACTION_LABELS } from '@domain/constants/input-action-labels';
import { SettingsRules } from '@domain/services/SettingsRules';
import type { InputActionId } from '@domain/types/InputActionId';
import { getAppDependenciesFromRegistry } from '@game/scene-context';
import type { SettingsSceneData } from '@game/scene-data';
import { SceneKeys, type SceneKey } from '@game/scene-keys';
import { createMenuInputHandler } from '@presentation/input/createMenuInputHandler';
import type { MenuInputHandler } from '@presentation/input/createMenuInputHandler';
import { formatKeyBinding } from '@presentation/input/formatKeyCode';
import Phaser from 'phaser';

type MainSettingsRow = 'master' | 'music' | 'sfx' | 'fullscreen' | 'controls';
type SettingsView = 'main' | 'controls';

const MAIN_ROWS: readonly MainSettingsRow[] = ['master', 'music', 'sfx', 'fullscreen', 'controls'];
const CONTROLS_RESET_ROW = '__reset__' as const;
type ControlsRow = InputActionId | typeof CONTROLS_RESET_ROW;

export class SettingsScene extends Phaser.Scene {
  private selectedRow = 0;
  private returnScene: SceneKey = SceneKeys.MainMenu;
  private view: SettingsView = 'main';
  private controlsSelectedRow = 0;
  private isListeningForKey = false;
  private conflictMessage = '';
  private readonly settingsRules = new SettingsRules();
  private menuInput?: MenuInputHandler;
  private listenKeyHandler?: (event: KeyboardEvent) => void;
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private footerText?: Phaser.GameObjects.Text;
  private conflictText?: Phaser.GameObjects.Text;
  private listenPromptText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKeys.Settings });
  }

  init(data?: SettingsSceneData): void {
    this.returnScene = data?.returnScene ?? SceneKeys.MainMenu;
    this.view = 'main';
    this.selectedRow = 0;
    this.controlsSelectedRow = 0;
    this.isListeningForKey = false;
    this.conflictMessage = '';
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#1e1b4b');

    this.add
      .text(width / 2, height / 2 - 180, 'Настройки', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.rowTexts = Array.from({ length: 12 }, (_, index) =>
      this.add
        .text(width / 2, height / 2 - 80 + index * 40, '', {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#64748b',
        })
        .setOrigin(0.5),
    );

    this.footerText = this.add
      .text(width / 2, height / 2 + 220, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.conflictText = this.add
      .text(width / 2, height / 2 + 180, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f87171',
      })
      .setOrigin(0.5);

    this.listenPromptText = this.add
      .text(width / 2, height / 2 + 140, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    this.refreshView();

    this.menuInput = createMenuInputHandler(this, {
      onUp: () => this.moveSelection(-1),
      onDown: () => this.moveSelection(1),
      onLeft: () => this.adjustSelectedRow(-0.1),
      onRight: () => this.adjustSelectedRow(0.1),
      onConfirm: () => this.confirmSelection(),
      onCancel: () => this.handleCancel(),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopListeningForKey();
      this.menuInput?.destroy();
      this.menuInput = undefined;
    });
  }

  private moveSelection(delta: number): void {
    if (this.isListeningForKey) {
      return;
    }

    if (this.view === 'main') {
      this.selectedRow = (this.selectedRow + delta + MAIN_ROWS.length) % MAIN_ROWS.length;
      this.refreshView();
      return;
    }

    const rowCount = this.getControlsRows().length;
    this.controlsSelectedRow = (this.controlsSelectedRow + delta + rowCount) % rowCount;
    this.conflictMessage = '';
    this.refreshView();
  }

  private adjustSelectedRow(delta: number): void {
    if (this.view !== 'main' || this.isListeningForKey) {
      return;
    }

    const dependencies = getAppDependenciesFromRegistry(this);
    const settings = dependencies.settingsPort.getSettings();
    const row = MAIN_ROWS[this.selectedRow];

    if (row === 'master') {
      dependencies.updateSettings.execute({
        audio: { masterVolume: this.clampVolume(settings.audio.masterVolume + delta) },
      });
      this.refreshView();
      return;
    }

    if (row === 'music') {
      dependencies.updateSettings.execute({
        audio: { musicVolume: this.clampVolume(settings.audio.musicVolume + delta) },
      });
      this.refreshView();
      return;
    }

    if (row === 'sfx') {
      dependencies.updateSettings.execute({
        audio: { sfxVolume: this.clampVolume(settings.audio.sfxVolume + delta) },
      });
    }
  }

  private confirmSelection(): void {
    if (this.isListeningForKey) {
      return;
    }

    if (this.view === 'main') {
      const row = MAIN_ROWS[this.selectedRow];

      if (row === 'controls') {
        this.view = 'controls';
        this.controlsSelectedRow = 0;
        this.conflictMessage = '';
        this.refreshView();
        return;
      }

      if (row !== 'fullscreen') {
        return;
      }

      const dependencies = getAppDependenciesFromRegistry(this);
      const settings = dependencies.settingsPort.getSettings();
      const nextFullscreen = !settings.video.fullscreen;

      if (nextFullscreen) {
        this.scale.startFullscreen();
      } else {
        this.scale.stopFullscreen();
      }

      dependencies.updateSettings.execute({ video: { fullscreen: nextFullscreen } });
      this.refreshView();
      return;
    }

    const controlsRow = this.getControlsRows()[this.controlsSelectedRow];

    if (controlsRow === CONTROLS_RESET_ROW) {
      this.resetControlsToDefaults();
      return;
    }

    this.startListeningForKey(controlsRow);
  }

  private handleCancel(): void {
    if (this.isListeningForKey) {
      this.stopListeningForKey();
      this.refreshView();
      return;
    }

    if (this.view === 'controls') {
      this.view = 'main';
      this.conflictMessage = '';
      this.refreshView();
      return;
    }

    this.goBack();
  }

  private startListeningForKey(actionId: InputActionId): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    this.isListeningForKey = true;
    this.conflictMessage = '';
    this.refreshView();

    this.listenKeyHandler = (event: KeyboardEvent): void => {
      event.preventDefault();

      if (event.code === 'Escape') {
        this.stopListeningForKey();
        this.refreshView();
        return;
      }

      const assigned = this.tryAssignKeyBinding(actionId, event.code);

      if (!assigned) {
        this.conflictMessage = 'Клавиша уже занята';
        this.stopListeningForKey();
        this.refreshView();
        return;
      }

      this.stopListeningForKey();
      this.refreshView();
    };

    keyboard.on('keydown', this.listenKeyHandler);
  }

  private tryAssignKeyBinding(actionId: InputActionId, code: string): boolean {
    const dependencies = getAppDependenciesFromRegistry(this);
    const current = dependencies.settingsPort.getSettings();
    const assigned = this.settingsRules.assignKeyBinding(current, actionId, code);

    if (!assigned) {
      return false;
    }

    dependencies.settingsPort.updateSettings({ controls: assigned.controls });
    return true;
  }

  private stopListeningForKey(): void {
    const keyboard = this.input.keyboard;

    if (keyboard && this.listenKeyHandler) {
      keyboard.off('keydown', this.listenKeyHandler);
    }

    this.listenKeyHandler = undefined;
    this.isListeningForKey = false;
  }

  private resetControlsToDefaults(): void {
    const dependencies = getAppDependenciesFromRegistry(this);
    const current = dependencies.settingsPort.getSettings();
    const reset = this.settingsRules.resetControlsToDefaults(current);
    dependencies.settingsPort.updateSettings({ controls: reset.controls });
    this.conflictMessage = '';
    this.refreshView();
  }

  private goBack(): void {
    if (this.returnScene === SceneKeys.Game) {
      this.scene.stop();
      this.scene.resume(SceneKeys.Game);
      return;
    }

    this.scene.start(SceneKeys.MainMenu);
  }

  private getControlsRows(): ControlsRow[] {
    return [...INPUT_ACTION_IDS, CONTROLS_RESET_ROW];
  }

  private refreshView(): void {
    if (this.view === 'main') {
      this.refreshMainRows();
    } else {
      this.refreshControlsRows();
    }

    this.refreshFooter();
    this.refreshListenPrompt();
    this.refreshConflictMessage();
  }

  private refreshMainRows(): void {
    const dependencies = getAppDependenciesFromRegistry(this);
    const settings = dependencies.settingsPort.getSettings();
    const labels = [
      `Master Volume: ${settings.audio.masterVolume.toFixed(1)}`,
      `Music Volume: ${settings.audio.musicVolume.toFixed(1)}`,
      `SFX Volume: ${settings.audio.sfxVolume.toFixed(1)}`,
      `Fullscreen: ${settings.video.fullscreen ? 'On' : 'Off'}`,
      'Управление',
    ];

    this.rowTexts.forEach((text, index) => {
      const label = labels[index];
      text.setVisible(label !== undefined);
      text.setText(label ?? '');
      text.setColor(index === this.selectedRow ? '#f8fafc' : '#64748b');
    });
  }

  private refreshControlsRows(): void {
    const dependencies = getAppDependenciesFromRegistry(this);
    const settings = dependencies.settingsPort.getSettings();
    const rows = this.getControlsRows();

    this.rowTexts.forEach((text, index) => {
      const row = rows[index];

      if (!row) {
        text.setVisible(false);
        text.setText('');
        return;
      }

      text.setVisible(true);

      if (row === CONTROLS_RESET_ROW) {
        text.setText('Сброс по умолчанию');
      } else {
        const label = INPUT_ACTION_LABELS[row];
        const keys = formatKeyBinding(settings.controls.keyBindings[row]);
        text.setText(`${label}: ${keys}`);
      }

      text.setColor(index === this.controlsSelectedRow ? '#f8fafc' : '#64748b');
    });
  }

  private refreshFooter(): void {
    if (!this.footerText) {
      return;
    }

    if (this.isListeningForKey) {
      this.footerText.setText('Нажмите клавишу…   Esc — отмена');
      return;
    }

    if (this.view === 'controls') {
      this.footerText.setText('↑↓ выбор   Enter/Space — переназначить   Esc — назад');
      return;
    }

    this.footerText.setText(
      '↑↓ выбор   ←→ громкость   Space/A — fullscreen   Esc/B — назад',
    );
  }

  private refreshListenPrompt(): void {
    if (!this.listenPromptText) {
      return;
    }

    if (!this.isListeningForKey || this.view !== 'controls') {
      this.listenPromptText.setText('');
      return;
    }

    const row = this.getControlsRows()[this.controlsSelectedRow];
    if (row === CONTROLS_RESET_ROW || !row) {
      this.listenPromptText.setText('');
      return;
    }

    this.listenPromptText.setText(`Назначение: ${INPUT_ACTION_LABELS[row]}`);
  }

  private refreshConflictMessage(): void {
    if (!this.conflictText) {
      return;
    }

    this.conflictText.setText(this.conflictMessage);
  }

  private clampVolume(value: number): number {
    return Math.min(1, Math.max(0, Number(value.toFixed(1))));
  }
}
