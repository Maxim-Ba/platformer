import { getAppDependenciesFromRegistry } from '@game/scene-context';
import { SceneKeys } from '@game/scene-keys';
import { createMenuList } from '@presentation/ui/MenuList';
import Phaser from 'phaser';

const MENU_ITEMS = [
  { id: 'new-game', label: 'Новая игра' },
  { id: 'load', label: 'Загрузка' },
  { id: 'settings', label: 'Настройки' },
] as const;

export class MainMenuScene extends Phaser.Scene {
  private hasTransitioned = false;

  constructor() {
    super({ key: SceneKeys.MainMenu });
  }

  create(): void {
    this.hasTransitioned = false;

    const { width, height } = this.cameras.main;
    const dependencies = getAppDependenciesFromRegistry(this);

    this.cameras.main.setBackgroundColor('#1e1b4b');

    this.add
      .text(width / 2, height / 2 - 160, 'Platformer', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    createMenuList(this, MENU_ITEMS, {
      x: width / 2,
      y: height / 2,
      onSelect: (item) => {
        if (this.hasTransitioned) {
          return;
        }

        this.hasTransitioned = true;

        if (item.id === 'new-game') {
          const { levelId, currentRoomId } = dependencies.startNewGame.execute();
          this.scene.start(SceneKeys.Game, { levelId, currentRoomId });
          return;
        }

        if (item.id === 'load') {
          this.scene.start(SceneKeys.LoadGame);
          return;
        }

        this.scene.start(SceneKeys.Settings);
      },
    });
  }
}
