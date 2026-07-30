import { getAppDependenciesFromRegistry } from '@game/scene-context';
import type { SettingsSceneData } from '@game/scene-data';
import { SceneKeys, type SceneKey } from '@game/scene-keys';
import { createMenuInputHandler } from '@presentation/input/createMenuInputHandler';
import type { MenuInputHandler } from '@presentation/input/createMenuInputHandler';
import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
  private selectedRow = 0;
  private returnScene: SceneKey = SceneKeys.MainMenu;
  private readonly rows = ['master', 'music', 'sfx', 'fullscreen'] as const;
  private menuInput?: MenuInputHandler;
  private rowTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: SceneKeys.Settings });
  }

  init(data?: SettingsSceneData): void {
    this.returnScene = data?.returnScene ?? SceneKeys.MainMenu;
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

    this.rowTexts = this.rows.map((_, index) =>
      this.add
        .text(width / 2, height / 2 - 40 + index * 56, '', {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#64748b',
        })
        .setOrigin(0.5),
    );

    this.add
      .text(
        width / 2,
        height / 2 + 220,
        '↑↓ выбор   ←→ громкость   Space/A — fullscreen   Esc/B — назад',
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#94a3b8',
        },
      )
      .setOrigin(0.5);

    this.refreshRows();

    this.menuInput = createMenuInputHandler(this, {
      onUp: () => this.moveSelection(-1),
      onDown: () => this.moveSelection(1),
      onLeft: () => this.adjustSelectedRow(-0.1),
      onRight: () => this.adjustSelectedRow(0.1),
      onConfirm: () => this.confirmSelection(),
      onCancel: () => this.goBack(),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.menuInput?.destroy();
      this.menuInput = undefined;
    });
  }

  private moveSelection(delta: number): void {
    this.selectedRow = (this.selectedRow + delta + this.rows.length) % this.rows.length;
    this.refreshRows();
  }

  private adjustSelectedRow(delta: number): void {
    const dependencies = getAppDependenciesFromRegistry(this);
    const settings = dependencies.settingsPort.getSettings();
    const row = this.rows[this.selectedRow];

    if (row === 'master') {
      dependencies.updateSettings.execute({
        audio: { masterVolume: this.clampVolume(settings.audio.masterVolume + delta) },
      });
      this.refreshRows();
      return;
    }

    if (row === 'music') {
      dependencies.updateSettings.execute({
        audio: { musicVolume: this.clampVolume(settings.audio.musicVolume + delta) },
      });
      this.refreshRows();
      return;
    }

    if (row === 'sfx') {
      dependencies.updateSettings.execute({
        audio: { sfxVolume: this.clampVolume(settings.audio.sfxVolume + delta) },
      });
    }
  }

  private confirmSelection(): void {
    if (this.rows[this.selectedRow] !== 'fullscreen') {
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
    this.refreshRows();
  }

  private goBack(): void {
    if (this.returnScene === SceneKeys.Game) {
      this.scene.stop();
      this.scene.resume(SceneKeys.Game);
      return;
    }

    this.scene.start(SceneKeys.MainMenu);
  }

  private refreshRows(): void {
    const dependencies = getAppDependenciesFromRegistry(this);
    const settings = dependencies.settingsPort.getSettings();
    const labels = [
      `Master Volume: ${settings.audio.masterVolume.toFixed(1)}`,
      `Music Volume: ${settings.audio.musicVolume.toFixed(1)}`,
      `SFX Volume: ${settings.audio.sfxVolume.toFixed(1)}`,
      `Fullscreen: ${settings.video.fullscreen ? 'On' : 'Off'}`,
    ];

    this.rowTexts.forEach((text, index) => {
      text.setText(labels[index] ?? '');
      text.setColor(index === this.selectedRow ? '#f8fafc' : '#64748b');
    });
  }

  private clampVolume(value: number): number {
    return Math.min(1, Math.max(0, Number(value.toFixed(1))));
  }
}
