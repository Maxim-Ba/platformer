import { DEFAULT_LEVEL_ID } from '@game/constants';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.MainMenu });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#1e1b4b');

    this.add
      .text(width / 2, height / 2 - 80, 'Platformer', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    const startText = this.add
      .text(width / 2, height / 2 + 40, 'Press SPACE or ENTER to start', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.once('keydown-SPACE', () => {
      this.startGame();
    });
    keyboard.once('keydown-ENTER', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    this.scene.start(SceneKeys.Game, { levelId: DEFAULT_LEVEL_ID });
  }
}
