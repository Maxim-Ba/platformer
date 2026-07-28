import { DEFAULT_LEVEL_ID } from '@game/constants';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.GameOver });
  }

  create(): void {
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
      .text(width / 2, height / 2 + 20, 'R — Restart    M — Main Menu', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#fca5a5',
      })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.on('keydown-R', () => {
      this.restart();
    });
    keyboard.on('keydown-M', () => {
      this.goToMenu();
    });
  }

  private restart(): void {
    this.scene.start(SceneKeys.Game, { levelId: DEFAULT_LEVEL_ID });
  }

  private goToMenu(): void {
    this.scene.start(SceneKeys.MainMenu);
  }
}
