import { DEFAULT_LEVEL_ID } from '@game/constants';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private hasTransitioned = false;
  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (this.hasTransitioned) {
      return;
    }

    if (event.code === 'KeyR' || event.code === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      this.restart();
      return;
    }

    if (event.code === 'KeyM') {
      event.preventDefault();
      this.goToMenu();
    }
  };

  constructor() {
    super({ key: SceneKeys.GameOver });
  }

  create(): void {
    this.hasTransitioned = false;

    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#450a0a');

    this.add
      .text(width / 2, height / 2 - 60, 'Game Over', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#fecaca',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'R / Enter — Restart    M — Main Menu', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#fca5a5',
      })
      .setOrigin(0.5);

    window.addEventListener('keydown', this.onWindowKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onWindowKeyDown);
    });
  }

  private restart(): void {
    this.hasTransitioned = true;
    this.scene.start(SceneKeys.Game, { levelId: DEFAULT_LEVEL_ID });
  }

  private goToMenu(): void {
    this.hasTransitioned = true;
    this.scene.start(SceneKeys.MainMenu);
  }
}
