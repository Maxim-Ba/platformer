import type { InputSnapshot } from '@application/use-cases/InputSnapshot';
import type { IInputPort } from '@application/ports/IInputPort';
import { COYOTE_TIME_MS } from '@domain/constants/movement';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';
import { PLAYER_ENTITY_ID } from '@game/constants';
import type { SceneDependencies } from '@game/composition-root';
import { createSceneDependencies } from '@game/composition-root';
import { PlayerSprite } from '@presentation/entities/PlayerSprite';
import Phaser from 'phaser';

const GROUND_TEXTURE_KEY = 'ground';
const GROUND_WIDTH = 800;
const GROUND_HEIGHT = 32;

function ensureGroundTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(GROUND_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0x78716c, 1);
  graphics.fillRect(0, 0, GROUND_WIDTH, GROUND_HEIGHT);
  graphics.generateTexture(GROUND_TEXTURE_KEY, GROUND_WIDTH, GROUND_HEIGHT);
  graphics.destroy();
}

function createInputSnapshot(inputPort: IInputPort): InputSnapshot {
  let horizontalAxis: -1 | 0 | 1 = 0;
  if (inputPort.isLeftPressed()) {
    horizontalAxis = -1;
  } else if (inputPort.isRightPressed()) {
    horizontalAxis = 1;
  }

  return {
    horizontalAxis,
    jumpPressed: inputPort.isJumpPressed(),
  };
}

export class GameScene extends Phaser.Scene {
  private deps!: SceneDependencies;
  private playerState!: PlayerState;
  private playerSprite!: PlayerSprite;
  private groundSurfaceY = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { createSceneDependencies?: typeof createSceneDependencies }): void {
    const createDeps = data.createSceneDependencies ?? createSceneDependencies;
    this.deps = createDeps(this);
  }

  create(): void {
    this.deps.physicsPort.setGravity(0);
    this.cameras.main.setBackgroundColor('#1e1b4b');
    this.cameras.main.roundPixels = true;

    ensureGroundTexture(this);
    const groundCenterY = this.scale.height - 64;
    const ground = this.add.image(this.scale.width / 2, groundCenterY, GROUND_TEXTURE_KEY);
    ground.setDepth(0);

    this.groundSurfaceY = groundCenterY - GROUND_HEIGHT / 2;

    const startX = this.scale.width / 2;
    this.playerSprite = new PlayerSprite(this, startX, this.groundSurfaceY);
    this.playerSprite.sprite.setDepth(1);

    this.playerState = new PlayerState(
      new Vector2(startX, this.groundSurfaceY),
      new Velocity(0, 0),
      true,
      COYOTE_TIME_MS,
      0,
    );

    this.add
      .text(24, 24, 'A/D or arrows — move, Space — jump', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '20px',
      })
      .setScrollFactor(0)
      .setDepth(10);
  }

  update(_time: number, delta: number): void {
    const wasGrounded = this.playerState.isGrounded;

    this.playerState = this.deps.updatePlayerMovement.execute({
      state: this.playerState,
      input: createInputSnapshot(this.deps.inputPort),
      deltaMs: delta,
      wasGrounded,
    });

    this.playerState = this.applyGroundContact(this.playerState);
    this.playerSprite.syncFromState(this.playerState);
    this.deps.physicsPort.syncFromDomain(PLAYER_ENTITY_ID, this.playerState);
  }

  private applyGroundContact(state: PlayerState): PlayerState {
    const { position, velocity } = state;

    if (velocity.y < 0 || position.y < this.groundSurfaceY) {
      return state.withGrounded(false);
    }

    return new PlayerState(
      new Vector2(position.x, this.groundSurfaceY),
      velocity.withY(0),
      true,
      COYOTE_TIME_MS,
      state.jumpBufferRemainingMs,
    );
  }
}
