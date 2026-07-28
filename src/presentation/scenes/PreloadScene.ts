import { FOUNDATION_ASSETS } from '@game/asset-keys';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

const PROGRESS_BAR_WIDTH = 300;
const PROGRESS_BAR_HEIGHT = 30;

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKeys.Preload });
  }

  preload(): void {
    this.createProgressUI();

    for (const asset of FOUNDATION_ASSETS) {
      if (asset.type === 'svg') {
        this.load.svg(asset.key, asset.path);
      } else {
        this.load.image(asset.key, asset.path);
      }
    }

    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value);
    });
  }

  create(): void {
    this.scene.start(SceneKeys.MainMenu);
  }

  private createProgressUI(): void {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#0f172a');

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(
      width / 2 - PROGRESS_BAR_WIDTH / 2 - 10,
      height / 2 - 30,
      PROGRESS_BAR_WIDTH + 20,
      PROGRESS_BAR_HEIGHT + 20,
    );

    this.progressBar = this.add.graphics();

    this.add
      .text(width / 2, height / 2 - 50, 'Loading...', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    this.percentText = this.add
      .text(width / 2, height / 2, '0%', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);
  }

  private updateProgressBar(progress: number): void {
    const { width, height } = this.cameras.main;

    this.progressBar.clear();
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(
      width / 2 - PROGRESS_BAR_WIDTH / 2,
      height / 2 - 20,
      PROGRESS_BAR_WIDTH * progress,
      PROGRESS_BAR_HEIGHT,
    );

    this.percentText.setText(`${Math.round(progress * 100)}%`);
  }
}
