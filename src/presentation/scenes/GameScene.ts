import type { InputSnapshot } from '@application/use-cases/InputSnapshot';
import type { AddExperience } from '@application/use-cases/AddExperience';
import type { IInputPort } from '@application/ports/IInputPort';
import type { LevelDefinition } from '@domain/entities/LevelDefinition';
import { HAZARD_DAMAGE } from '@domain/constants/health';
import { COYOTE_TIME_MS } from '@domain/constants/movement';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';
import { AssetKeys } from '@game/asset-keys';
import { DEFAULT_LEVEL_ID, PLAYER_ENTITY_ID } from '@game/constants';
import type { SceneDependencies } from '@game/composition-root';
import { getAppDependenciesFromRegistry } from '@game/scene-context';
import { SceneKeys } from '@game/scene-keys';
import type { TiledMapJson } from '@infrastructure/tiled/TiledTypes';
import { PlayerSprite } from '@presentation/entities/PlayerSprite';
import { overlapsPlayerAabb } from '@presentation/level/LevelInteraction';
import Phaser from 'phaser';

const CHECKPOINT_XP_REWARD = 10;
const RESPAWN_FADE_OUT_MS = 200;
const RESPAWN_FADE_IN_MS = 300;

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

function mapCacheKey(levelId: string): string {
  return `map-${levelId}`;
}

export class GameScene extends Phaser.Scene {
  private deps!: SceneDependencies;
  private addExperience!: AddExperience;
  private playerState!: PlayerState;
  private playerSprite?: PlayerSprite;
  private levelId = DEFAULT_LEVEL_ID;
  private level!: LevelDefinition;
  private groundLayer?: Phaser.Tilemaps.TilemapLayer;
  private respawnPosition!: Vector2;
  private activatedCheckpointIds = new Set<string>();
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private isRespawning = false;

  constructor() {
    super({ key: SceneKeys.Game });
  }

  init(data: { levelId?: string }): void {
    const appDependencies = getAppDependenciesFromRegistry(this);
    this.deps = appDependencies.createSceneDependencies(this);
    this.addExperience = appDependencies.addExperience;
    this.levelId = data.levelId ?? DEFAULT_LEVEL_ID;
  }

  preload(): void {
    this.load.tilemapTiledJSON(mapCacheKey(this.levelId), `assets/maps/${this.levelId}.json`);
    this.load.image(AssetKeys.Tileset, 'assets/tilesets/platformer-tiles.png');
  }

  create(): void {
    this.resetSceneState();
    this.bindSceneInput();
    this.initializeLevel();
    this.focusCanvas();
  }

  update(_time: number, delta: number): void {
    if (this.isRespawning || !this.playerSprite || !this.groundLayer) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.goToGameOver();
      return;
    }

    this.deps.healthPort.tick(delta);

    const previousPosition = this.playerState.position;
    const wasGrounded = this.playerState.isGrounded;

    this.playerState = this.deps.updatePlayerMovement.execute({
      state: this.playerState,
      input: createInputSnapshot(this.deps.inputPort),
      deltaMs: delta,
      wasGrounded,
    });

    this.playerState = this.deps.levelCollisionResolver.resolve(
      this.groundLayer,
      this.playerState,
      previousPosition,
    );

    this.handleLevelInteractions();

    this.playerSprite.syncFromState(this.playerState);
    this.deps.physicsPort.syncFromDomain(PLAYER_ENTITY_ID, this.playerState);
    this.deps.cameraPort.update(delta);
  }

  private resetSceneState(): void {
    this.playerSprite = undefined;
    this.groundLayer = undefined;
    this.activatedCheckpointIds = new Set();
    this.deps.healthPort.reset();
    this.isRespawning = false;
  }

  private bindSceneInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    this.keyEsc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private focusCanvas(): void {
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();
  }

  private initializeLevel(): void {
    this.deps.physicsPort.setGravity(0);
    this.cameras.main.setBackgroundColor('#1e1b4b');
    this.cameras.main.roundPixels = true;
    this.cameras.main.resetFX();

    const cacheKey = mapCacheKey(this.levelId);
    const cachedMap = this.cache.tilemap.get(cacheKey);
    if (!cachedMap) {
      throw new Error(`Tilemap "${cacheKey}" is not loaded.`);
    }

    this.level = this.deps.loadLevel.fromTiledMap(this.levelId, cachedMap.data as TiledMapJson);

    const map = this.make.tilemap({ key: cacheKey });
    const tileset = map.addTilesetImage('platformer', AssetKeys.Tileset);
    if (!tileset) {
      throw new Error(`Failed to bind tileset for level "${this.levelId}"`);
    }

    const groundLayer = map.createLayer('ground', tileset, 0, 0);
    const decorLayer = map.createLayer('decor', tileset, 0, 0);
    if (!groundLayer || !decorLayer) {
      throw new Error(`Failed to create tile layers for level "${this.levelId}"`);
    }

    groundLayer.setCollisionByProperty({ solid: true });
    groundLayer.setDepth(0);
    decorLayer.setDepth(1);
    this.groundLayer = groundLayer;

    const spawnPosition = this.deps.levelCollisionResolver.resolveSpawnPosition(
      groundLayer,
      this.level.playerSpawn.position,
    );
    this.respawnPosition = spawnPosition;

    this.renderLevelObjects();
    this.spawnPlayer(spawnPosition);
    this.setupCameraFollow();

    this.add
      .text(24, 24, 'A/D or arrows — move, Space — jump, Esc — game over', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '20px',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.registry.set('currentLevelId', this.levelId);
  }

  private renderLevelObjects(): void {
    for (const hazard of this.level.hazards) {
      this.add
        .rectangle(
          hazard.position.x + hazard.width / 2,
          hazard.position.y + hazard.height / 2,
          hazard.width,
          hazard.height,
          0xef4444,
          0.65,
        )
        .setDepth(2);
    }

    for (const checkpoint of this.level.checkpoints) {
      this.add
        .rectangle(
          checkpoint.position.x + checkpoint.width / 2,
          checkpoint.position.y + checkpoint.height / 2,
          checkpoint.width,
          checkpoint.height,
          0xfacc15,
          0.65,
        )
        .setDepth(2);
    }

    for (const exit of this.level.exits) {
      this.add
        .rectangle(
          exit.position.x + exit.width / 2,
          exit.position.y + exit.height / 2,
          exit.width,
          exit.height,
          0x22c55e,
          0.65,
        )
        .setDepth(2);
    }
  }

  private spawnPlayer(position: Vector2): void {
    if (this.playerSprite) {
      this.playerSprite.sprite.destroy();
    }

    this.playerSprite = new PlayerSprite(this, position.x, position.y);
    this.playerSprite.sprite.setDepth(3);

    this.playerState = new PlayerState(
      position,
      new Velocity(0, 0),
      true,
      COYOTE_TIME_MS,
      0,
    );

    this.deps.physicsPort.registerEntity(PLAYER_ENTITY_ID, this.playerSprite.sprite);
  }

  private setupCameraFollow(): void {
    if (!this.playerSprite) {
      return;
    }

    const { width, height } = this.level.bounds;
    const camera = this.cameras.main;

    this.deps.cameraPort.setViewportSize(camera.width, camera.height);
    this.deps.cameraPort.setBounds({ x: 0, y: 0, width, height });
    this.deps.cameraPort.attach(() => ({
      x: this.playerSprite!.sprite.x,
      y: this.playerSprite!.sprite.y,
    }));
  }

  private handleLevelInteractions(): void {
    const { x, y } = this.playerState.position;

    if (!this.deps.healthPort.isInvulnerable()) {
      for (const hazard of this.level.hazards) {
        if (
          overlapsPlayerAabb(x, y, hazard.position.x, hazard.position.y, hazard.width, hazard.height)
        ) {
          this.handleHazardDamage();
          return;
        }
      }
    }

    for (const checkpoint of this.level.checkpoints) {
      if (this.activatedCheckpointIds.has(checkpoint.id)) {
        continue;
      }

      if (
        overlapsPlayerAabb(
          x,
          y,
          checkpoint.position.x,
          checkpoint.position.y,
          checkpoint.width,
          checkpoint.height,
        )
      ) {
        this.activatedCheckpointIds.add(checkpoint.id);
        this.respawnPosition = this.deps.levelCollisionResolver.resolveSpawnPosition(
          this.groundLayer!,
          new Vector2(
            checkpoint.position.x + checkpoint.width / 2,
            checkpoint.position.y + checkpoint.height,
          ),
        );
        this.addExperience.execute(CHECKPOINT_XP_REWARD);
      }
    }

    for (const exit of this.level.exits) {
      if (overlapsPlayerAabb(x, y, exit.position.x, exit.position.y, exit.width, exit.height)) {
        this.goToGameOver();
        return;
      }
    }
  }

  private handleHazardDamage(): void {
    const result = this.deps.applyDamage.execute(HAZARD_DAMAGE);

    if (!result.survived) {
      this.goToGameOver();
      return;
    }

    this.respawnPlayer();
  }

  private respawnPlayer(): void {
    if (this.isRespawning) {
      return;
    }

    this.isRespawning = true;
    const camera = this.cameras.main;

    camera.fadeOut(RESPAWN_FADE_OUT_MS, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.spawnPlayer(this.respawnPosition);
      this.setupCameraFollow();
      this.deps.cameraPort.reset();

      camera.fadeIn(RESPAWN_FADE_IN_MS, 0, 0, 0);
      camera.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.isRespawning = false;
      });
    });
  }

  private goToGameOver(): void {
    this.scene.start(SceneKeys.GameOver);
  }
}
