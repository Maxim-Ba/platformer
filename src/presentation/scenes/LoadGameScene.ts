import type { SaveSlotMeta } from '@domain/types/GameSave';
import { getAppDependenciesFromRegistry } from '@game/scene-context';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

export class LoadGameScene extends Phaser.Scene {
  private slots: SaveSlotMeta[] = [];
  private selectedIndex = 0;
  private hasTransitioned = false;
  private slotText?: Phaser.GameObjects.Text;

  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Escape') {
      event.preventDefault();
      this.scene.start(SceneKeys.MainMenu);
      return;
    }

    if (this.slots.length === 0) {
      return;
    }

    if (event.code === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.slots.length) % this.slots.length;
      this.refreshSlotView();
      return;
    }

    if (event.code === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.slots.length;
      this.refreshSlotView();
      return;
    }

    if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
      event.preventDefault();
      this.loadSelectedSlot();
    }
  };

  constructor() {
    super({ key: SceneKeys.LoadGame });
  }

  create(): void {
    this.hasTransitioned = false;
    const dependencies = getAppDependenciesFromRegistry(this);
    this.slots = dependencies.listSaveSlots.execute();

    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#1e1b4b');

    this.add
      .text(width / 2, height / 2 - 160, 'Загрузка', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    if (this.slots.length === 0) {
      this.add
        .text(width / 2, height / 2, 'Нет сохранений', {
          fontFamily: 'monospace',
          fontSize: '28px',
          color: '#94a3b8',
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height / 2 + 80, 'Esc — назад', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#64748b',
        })
        .setOrigin(0.5);
    } else {
      this.slotText = this.add
        .text(width / 2, height / 2, '', {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#f8fafc',
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height / 2 + 120, 'Enter — загрузить   Esc — назад', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#64748b',
        })
        .setOrigin(0.5);

      this.refreshSlotView();
    }

    window.addEventListener('keydown', this.onWindowKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onWindowKeyDown);
    });
  }

  private refreshSlotView(): void {
    const slot = this.slots[this.selectedIndex];
    if (!slot || !this.slotText) {
      return;
    }

    const savedAt = new Date(slot.savedAt).toLocaleString('ru-RU');
    this.slotText.setText(`Слот: ${slot.slotId}\nУровень: ${slot.levelId}\nСохранено: ${savedAt}`);
  }

  private loadSelectedSlot(): void {
    if (this.hasTransitioned) {
      return;
    }

    const slot = this.slots[this.selectedIndex];
    if (!slot) {
      return;
    }

    const dependencies = getAppDependenciesFromRegistry(this);
    const result = dependencies.loadGame.execute({ slotId: slot.slotId });
    if (!result) {
      this.hasTransitioned = true;
      this.scene.start(SceneKeys.LoadGame);
      return;
    }

    this.hasTransitioned = true;
    this.scene.start(SceneKeys.Game, { levelId: result.levelId });
  }
}
