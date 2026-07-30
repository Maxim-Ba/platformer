import { GAMEPAD_BUTTON, GAMEPAD_STICK_THRESHOLD } from '@game/gamepad-bindings';
import Phaser from 'phaser';

export class PhaserGamepadReader {
  private pad?: Phaser.Input.Gamepad.Gamepad;
  private readonly onConnected: (pad: Phaser.Input.Gamepad.Gamepad) => void;
  private readonly previousButtonPressed: boolean[] = [];
  private readonly justPressedButtons = new Set<number>();

  constructor(scene: Phaser.Scene) {
    this.onConnected = (pad: Phaser.Input.Gamepad.Gamepad): void => {
      if (pad.index === 0) {
        this.pad = pad;
      }
    };

    const gamepadPlugin = scene.input.gamepad;
    if (!gamepadPlugin) {
      return;
    }

    const existingPad = gamepadPlugin.getPad(0);
    if (existingPad) {
      this.pad = existingPad;
    }

    gamepadPlugin.on('connected', this.onConnected);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gamepadPlugin.off('connected', this.onConnected);
    });
  }

  update(): void {
    this.justPressedButtons.clear();

    if (!this.pad) {
      return;
    }

    const total = this.pad.getButtonTotal();
    for (let index = 0; index < total; index += 1) {
      const pressed = this.pad.isButtonDown(index);
      const wasPressed = this.previousButtonPressed[index] ?? false;

      if (pressed && !wasPressed) {
        this.justPressedButtons.add(index);
      }

      this.previousButtonPressed[index] = pressed;
    }
  }

  wasButtonJustPressed(index: number): boolean {
    return this.justPressedButtons.has(index);
  }

  isButtonPressed(index: number): boolean {
    if (!this.pad) {
      return false;
    }

    return this.pad.isButtonDown(index);
  }

  private getLeftStickX(): number {
    if (!this.pad) {
      return 0;
    }

    return this.pad.leftStick.x;
  }

  isLeftPressed(): boolean {
    return (
      this.getLeftStickX() < -GAMEPAD_STICK_THRESHOLD ||
      this.isButtonPressed(GAMEPAD_BUTTON.DPAD_LEFT)
    );
  }

  isRightPressed(): boolean {
    return (
      this.getLeftStickX() > GAMEPAD_STICK_THRESHOLD ||
      this.isButtonPressed(GAMEPAD_BUTTON.DPAD_RIGHT)
    );
  }

  isJumpPressed(): boolean {
    return this.wasButtonJustPressed(GAMEPAD_BUTTON.A);
  }

  isAttackPressed(): boolean {
    return this.wasButtonJustPressed(GAMEPAD_BUTTON.X);
  }

  isInteractPressed(): boolean {
    return this.wasButtonJustPressed(GAMEPAD_BUTTON.RB);
  }

  isDashPressed(): boolean {
    return this.wasButtonJustPressed(GAMEPAD_BUTTON.Y);
  }
}
