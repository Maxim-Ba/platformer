import type { InputSnapshot } from '@application/use-cases/InputSnapshot';
import type { IInputPort } from '@application/ports/IInputPort';
import { AssetKeys } from '@game/asset-keys';
import { COYOTE_TIME_MS } from '@domain/constants/movement';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';
import { DEFAULT_LEVEL_ID, PLAYER_ENTITY_ID } from '@game/constants';
import type { SceneDependencies } from '@game/composition-root';
import { getAppDependenciesFromRegistry } from '@game/scene-context';
import { SceneKeys } from '@game/scene-keys';
import { PlayerSprite } from '@presentation/entities/PlayerSprite';
import Phaser from 'phaser';

const GROUND_HEIGHT = 32;

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
  private levelId = DEFAULT_LEVEL_ID;

  constructor() {
    super({ key: SceneKeys.Game });
  }

  init(data: { levelId?: string }): void {
    const appDependencies = getAppDependenciesFromRegistry(this);
    this.deps = appDependencies.createSceneDependencies(this);
    this.levelId = data.levelId ?? DEFAULT_LEVEL_ID;
  }

  create(): void {
    this.deps.physicsPort.setGravity(0);
    this.cameras.main.setBackgroundColor('#1e1b4b');
    this.cameras.main.roundPixels = true;

    const groundCenterY = this.scale.height - 64;
    const ground = this.add.image(this.scale.width / 2, groundCenterY, AssetKeys.Ground);
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
      .text(24, 24, 'A/D or arrows — move, Space — jump, Esc — game over', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '20px',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SceneKeys.GameOver);
    });

    this.registry.set('currentLevelId', this.levelId);
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
