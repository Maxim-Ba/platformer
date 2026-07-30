import { GAMEPAD_BUTTON } from '@game/gamepad-bindings';
import { PhaserGamepadReader } from '@infrastructure/phaser/PhaserGamepadReader';
import Phaser from 'phaser';

const DPAD_REPEAT_DELAY_MS = 150;

export interface MenuInputHandlerOptions {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface MenuInputHandler {
  destroy: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

export function createMenuInputHandler(
  scene: Phaser.Scene,
  options: MenuInputHandlerOptions,
  gamepadReader?: PhaserGamepadReader,
): MenuInputHandler {
  const reader = gamepadReader ?? new PhaserGamepadReader(scene);
  const ownsReader = !gamepadReader;
  const lastRepeatAt: Record<Direction, number> = {
    up: scene.time.now,
    down: scene.time.now,
    left: scene.time.now,
    right: scene.time.now,
  };

  const shouldFireDirection = (direction: Direction, justDown: boolean, held: boolean): boolean => {
    const now = scene.time.now;

    if (justDown) {
      lastRepeatAt[direction] = now;
      return true;
    }

    if (!held) {
      return false;
    }

    if (now - lastRepeatAt[direction] < DPAD_REPEAT_DELAY_MS) {
      return false;
    }

    lastRepeatAt[direction] = now;
    return true;
  };

  const fireDirection = (
    direction: Direction,
    buttonIndex: number,
    callback?: () => void,
  ): void => {
    if (!callback) {
      return;
    }

    const justDown = reader.wasButtonJustPressed(buttonIndex);
    const held = reader.isButtonPressed(buttonIndex);

    if (shouldFireDirection(direction, justDown, held)) {
      callback();
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowUp') {
      event.preventDefault();
      options.onUp?.();
      return;
    }

    if (event.code === 'ArrowDown') {
      event.preventDefault();
      options.onDown?.();
      return;
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      options.onLeft?.();
      return;
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      options.onRight?.();
      return;
    }

    if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
      event.preventDefault();
      options.onConfirm?.();
      return;
    }

    if (event.code === 'Escape') {
      event.preventDefault();
      options.onCancel?.();
    }
  };

  const onUpdate = (): void => {
    reader.update();

    fireDirection('up', GAMEPAD_BUTTON.DPAD_UP, options.onUp);
    fireDirection('down', GAMEPAD_BUTTON.DPAD_DOWN, options.onDown);
    fireDirection('left', GAMEPAD_BUTTON.DPAD_LEFT, options.onLeft);
    fireDirection('right', GAMEPAD_BUTTON.DPAD_RIGHT, options.onRight);

    if (reader.wasButtonJustPressed(GAMEPAD_BUTTON.A)) {
      options.onConfirm?.();
    }

    if (reader.wasButtonJustPressed(GAMEPAD_BUTTON.B)) {
      options.onCancel?.();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  scene.events.on('update', onUpdate);

  return {
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      scene.events.off('update', onUpdate);
      if (ownsReader) {
        // Reader cleans up via scene shutdown listener.
      }
    },
  };
}
