import type { LevelCompleteSceneData } from '@game/scene-data';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

export class LevelCompleteScene extends Phaser.Scene {
  private hasTransitioned = false;
  private levelId = '';
  private nextLevelId?: string;

  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (this.hasTransitioned) {
      return;
    }

    if (
      this.nextLevelId &&
      (event.code === 'KeyN' || event.code === 'Enter' || event.code === 'NumpadEnter')
    ) {
      event.preventDefault();
      this.goToNextLevel();
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      this.retryLevel();
      return;
    }

    if (event.code === 'KeyM') {
      event.preventDefault();
      this.goToMenu();
    }
  };

  constructor() {
    super({ key: SceneKeys.LevelComplete });
  }

  init(data: LevelCompleteSceneData): void {
    this.levelId = data.levelId;
    this.nextLevelId = data.nextLevelId;
  }

  create(): void {
    this.hasTransitioned = false;

    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#14532d');

    this.add
      .text(width / 2, height / 2 - 100, 'Level Complete', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#bbf7d0',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 20, this.levelId, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#86efac',
      })
      .setOrigin(0.5);

    if (this.nextLevelId) {
      this.add
        .text(width / 2, height / 2 + 30, `Next: ${this.nextLevelId}`, {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#4ade80',
        })
        .setOrigin(0.5);
    }

    const controlsText = this.nextLevelId
      ? 'N / Enter — Next Level    R — Retry    M — Main Menu'
      : 'R — Retry    M — Main Menu';

    this.add
      .text(width / 2, height / 2 + 90, controlsText, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#86efac',
      })
      .setOrigin(0.5);

    window.addEventListener('keydown', this.onWindowKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onWindowKeyDown);
    });
  }

  private goToNextLevel(): void {
    if (!this.nextLevelId) {
      return;
    }

    this.hasTransitioned = true;
    this.scene.start(SceneKeys.Game, { levelId: this.nextLevelId });
  }

  private retryLevel(): void {
    this.hasTransitioned = true;
    this.scene.start(SceneKeys.Game, { levelId: this.levelId });
  }

  private goToMenu(): void {
    this.hasTransitioned = true;
    this.scene.start(SceneKeys.MainMenu);
  }
}
