import type { InputSnapshot } from '@application/use-cases/InputSnapshot';
import type { AddExperience } from '@application/use-cases/AddExperience';
import type { IInputPort } from '@application/ports/IInputPort';
import type { RoomDefinition } from '@domain/entities/RoomDefinition';
import type { RoomTransitionPlan } from '@domain/entities/RoomTransitionPlan';
import { HAZARD_DAMAGE } from '@domain/constants/health';
import { CombatRules } from '@domain/services/CombatRules';
import { COYOTE_TIME_MS } from '@domain/constants/movement';
import { DEFAULT_SAVE_SLOT_ID } from '@domain/constants/save';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';
import type { InputActionId } from '@domain/types/InputActionId';
import {
  AssetKeys,
  BEAST_SOLDIER_TILESET_PATH,
  GAME_COMBAT_ASSETS,
  LEVEL_TILESET_PATH,
} from '@game/asset-keys';
import { assetUrl } from '@game/assetUrl';
import {
  CHARACTER_MENU_TABS,
  getTabByIndex,
  getTabIndex,
  type CharacterMenuTabId,
} from '@game/character-menu-config';
import { GAMEPAD_BUTTON } from '@game/gamepad-bindings';
import { DEFAULT_LEVEL_ID, getNextLevelId, PLAYER_ENTITY_ID } from '@game/constants';
import type { SceneDependencies } from '@game/composition-root';
import { getAppDependenciesFromRegistry } from '@game/scene-context';
import { SceneKeys } from '@game/scene-keys';
import type { TiledMapJson } from '@infrastructure/tiled/TiledTypes';
import { registerEnemyAnimations } from '@presentation/animation/EnemyAnimationRegistry';
import {
  registerMeleeSlashAnimation,
  VFX_MELEE_SLASH_ANIM_KEY,
} from '@presentation/animation/vfxSheetConfig';
import { PlayerSprite } from '@presentation/entities/PlayerSprite';
import { EnemySprite } from '@presentation/entities/EnemySprite';
import { ProjectileSprite } from '@presentation/entities/ProjectileSprite';
import { containSize } from '@presentation/level/containSize';
import { overlapsPlayerAabb } from '@presentation/level/LevelInteraction';
import { createGameHud, type GameHud } from '@presentation/ui/hud/GameHud';
import {
  createCharacterMenuOverlay,
  type CharacterMenuOverlay,
} from '@presentation/ui/CharacterMenuOverlay';
import {
  createPauseMenuOverlay,
  type PauseMenuOverlay,
} from '@presentation/ui/PauseMenuOverlay';
import { isActionJustDown } from '@presentation/input/isActionJustDown';
import Phaser from 'phaser';

const CHECKPOINT_XP_REWARD = 10;
const RESPAWN_FADE_OUT_MS = 200;
const RESPAWN_FADE_IN_MS = 300;
const LEVEL_COMPLETE_FADE_OUT_MS = 200;

const CHAR_MENU_ACTION_BY_TAB: Record<CharacterMenuTabId, InputActionId> = {
  inventory: 'charMenuInventory',
  skills: 'charMenuSkills',
  stats: 'charMenuStats',
  abilities: 'charMenuUpgrades',
  map: 'charMenuMap',
};

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
    dashPressed: inputPort.isDashPressed(),
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
  private currentRoomId = DEFAULT_LEVEL_ID;
  private level!: RoomDefinition;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private groundLayer?: Phaser.Tilemaps.TilemapLayer;
  private decorLayer?: Phaser.Tilemaps.TilemapLayer;
  private readonly levelObjectVisuals: Phaser.GameObjects.GameObject[] = [];
  private respawnPosition!: Vector2;
  private activatedCheckpointIds = new Set<string>();
  private readonly hotkeyCache = new Map<string, Phaser.Input.Keyboard.Key>();
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private isCharacterMenuOpen = false;
  private lastCharacterMenuTabId: CharacterMenuTabId = 'inventory';
  private characterMenuOverlay?: CharacterMenuOverlay;
  private isPaused = false;
  private pauseMenuOverlay?: PauseMenuOverlay;
  private isRespawning = false;
  private isCompleting = false;
  private isTransitioning = false;
  private hud?: GameHud;
  private facingDirection: -1 | 1 = 1;
  private enemySprites = new Map<string, EnemySprite>();
  private projectileSprites = new Map<string, ProjectileSprite>();
  private attackHitboxFeedback?: Phaser.GameObjects.Sprite;
  private readonly combatRules = new CombatRules();

  constructor() {
    super({ key: SceneKeys.Game });
  }

  init(data: { levelId?: string; currentRoomId?: string }): void {
    const appDependencies = getAppDependenciesFromRegistry(this);
    this.deps = appDependencies.createSceneDependencies(this);
    this.addExperience = appDependencies.addExperience;
    this.levelId = data.levelId ?? DEFAULT_LEVEL_ID;
    this.currentRoomId = data.currentRoomId ?? this.levelId;
  }

  preload(): void {
    this.load.tilemapTiledJSON(
      mapCacheKey(this.currentRoomId),
      assetUrl(`assets/maps/${this.currentRoomId}.json`),
    );
    this.load.image(AssetKeys.Tileset, assetUrl(LEVEL_TILESET_PATH));
    this.load.image(AssetKeys.BeastSoldierTileset, assetUrl(BEAST_SOLDIER_TILESET_PATH));

    for (const asset of GAME_COMBAT_ASSETS) {
      const url = assetUrl(asset.path);
      if (asset.type === 'spritesheet') {
        this.load.spritesheet(asset.key, url, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
        });
      } else {
        this.load.image(asset.key, url);
      }
    }
  }

  create(): void {
    registerEnemyAnimations(this);
    registerMeleeSlashAnimation(this);
    this.resetSceneState();
    this.bindSceneInput();
    this.bindPauseResume();
    this.initializeLevel();
    this.focusCanvas();
  }

  update(_time: number, delta: number): void {
    this.deps.gamepadReader.update();

    if (this.isPaused) {
      if (
        this.isPausePressed() ||
        this.deps.gamepadReader.wasButtonJustPressed(GAMEPAD_BUTTON.START)
      ) {
        this.closePauseMenu();
      }

      return;
    }

    if (this.handleCharacterMenuInput()) {
      return;
    }

    if (this.isRespawning || this.isCompleting || this.isTransitioning || !this.playerSprite || !this.groundLayer) {
      return;
    }

    if (
      this.isPausePressed() ||
      this.deps.gamepadReader.wasButtonJustPressed(GAMEPAD_BUTTON.START)
    ) {
      this.openPauseMenu();
      return;
    }

    this.deps.healthPort.tick(delta);
    this.deps.dashPort.tick(delta);

    const previousPosition = this.playerState.position;
    const wasGrounded = this.playerState.isGrounded;
    const input = createInputSnapshot(this.deps.inputPort);
    const facingDirection = this.playerSprite.getFacingDirection();

    this.deps.executeDash.execute({
      dashPressed: input.dashPressed,
      horizontalAxis: input.horizontalAxis,
      facingDirection,
    });

    const dashState = this.deps.dashPort.getDashState();

    if (dashState.isDashing) {
      this.playerState = this.deps.updatePlayerDash.execute({
        state: this.playerState,
        direction: dashState.direction,
        deltaMs: delta,
      });
    } else {
      this.playerState = this.deps.updatePlayerMovement.execute({
        state: this.playerState,
        input,
        deltaMs: delta,
        wasGrounded,
      });
    }

    this.playerState = this.deps.levelCollisionResolver.resolve(
      this.groundLayer,
      this.playerState,
      previousPosition,
    );

    this.handleLevelInteractions();

    this.updateFacingDirection();
    this.handleCombat(delta);

    const attackState = this.deps.combatPort.getAttackState();
    this.playerSprite.syncFromState(this.playerState, {
      isAttacking: this.combatRules.isAttackActive(attackState),
      isDashing: dashState.isDashing,
      isHurt: this.deps.healthPort.isInvulnerable() && !dashState.isDashing,
    });
    this.playerSprite.setDashing(dashState.isDashing);
    this.deps.physicsPort.syncFromDomain(PLAYER_ENTITY_ID, this.playerState);
    this.deps.cameraPort.update(delta);
    this.hud?.update();
  }

  private resetSceneState(): void {
    this.destroyPauseMenu();
    this.destroyCharacterMenu();
    this.destroyHud();
    this.playerSprite = undefined;
    this.groundLayer = undefined;
    this.decorLayer = undefined;
    this.tilemap = undefined;
    this.clearLevelObjectVisuals();
    this.activatedCheckpointIds = new Set();
    this.deps.healthPort.reset();
    this.deps.manaPort.reset();
    this.deps.energyPort.reset();
    this.deps.combatPort.reset();
    this.deps.dashPort.reset();
    this.deps.enemyPort.reset();
    this.destroyEnemySprites();
    this.destroyProjectileSprites();
    this.destroyAttackFeedback();
    this.facingDirection = 1;
    this.isRespawning = false;
    this.isCompleting = false;
    this.isTransitioning = false;
    this.isPaused = false;
  }

  private destroyHud(): void {
    this.hud?.destroy();
    this.hud = undefined;
  }

  private bindSceneInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    this.keyEsc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private isPausePressed(): boolean {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return false;
    }

    const appDependencies = getAppDependenciesFromRegistry(this);
    const pauseBinding = appDependencies.settingsPort.getSettings().controls.keyBindings.pause;

    return isActionJustDown(keyboard, pauseBinding, this.hotkeyCache);
  }

  private getCharacterMenuBinding(tabId: CharacterMenuTabId): string | string[] {
    const appDependencies = getAppDependenciesFromRegistry(this);
    const actionId = CHAR_MENU_ACTION_BY_TAB[tabId];
    return appDependencies.settingsPort.getSettings().controls.keyBindings[actionId];
  }

  private bindPauseResume(): void {
    const onResumeFromSettings = (): void => {
      if (!this.isPaused) {
        return;
      }

      if (!this.pauseMenuOverlay) {
        this.pauseMenuOverlay = createPauseMenuOverlay(this, {
          onSettings: () => this.openSettingsFromPause(),
          onSave: () => this.saveFromPause(),
          onCheckpoint: () => this.restartFromCheckpoint(),
          onExit: () => this.exitToMainMenu(),
        });
      }
    };

    this.events.on('resume', onResumeFromSettings);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('resume', onResumeFromSettings);
    });
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

    const cacheKey = mapCacheKey(this.currentRoomId);
    const cachedMap = this.cache.tilemap.get(cacheKey);
    if (!cachedMap) {
      throw new Error(`Tilemap "${cacheKey}" is not loaded.`);
    }

    this.level = this.deps.loadLevel.fromTiledMap(this.currentRoomId, cachedMap.data as TiledMapJson);
    this.buildRoomLayers(cacheKey);

    const spawnPosition = this.deps.levelCollisionResolver.resolveSpawnPosition(
      this.groundLayer!,
      this.level.playerSpawn.position,
    );
    this.respawnPosition = spawnPosition;

    this.renderLevelObjects();
    this.spawnEnemies();
    this.spawnPlayer(spawnPosition);
    this.setupCameraFollow();
    this.createHud();

    this.registry.set('currentLevelId', this.currentRoomId);
  }

  private buildRoomLayers(cacheKey: string): void {
    const map = this.make.tilemap({ key: cacheKey });
    const platformerTileset = map.addTilesetImage('platformer', AssetKeys.Tileset);
    const beastSoldierTileset = map.addTilesetImage('beast_soldier', AssetKeys.BeastSoldierTileset);
    if (!platformerTileset || !beastSoldierTileset) {
      throw new Error(`Failed to bind tilesets for room "${this.currentRoomId}"`);
    }

    const tilesets = [platformerTileset, beastSoldierTileset];
    const groundLayer = map.createLayer('ground', tilesets, 0, 0);
    const decorLayer = map.createLayer('decor', tilesets, 0, 0);
    if (!groundLayer || !decorLayer) {
      throw new Error(`Failed to create tile layers for room "${this.currentRoomId}"`);
    }

    groundLayer.setCollisionByProperty({ solid: true });
    groundLayer.setDepth(0);
    decorLayer.setDepth(1);
    this.tilemap = map;
    this.groundLayer = groundLayer;
    this.decorLayer = decorLayer;
  }

  private createHud(): void {
    const appDependencies = getAppDependenciesFromRegistry(this);

    this.hud = createGameHud(this, {
      healthPort: this.deps.healthPort,
      manaPort: this.deps.manaPort,
      energyPort: this.deps.energyPort,
      progressionPort: appDependencies.progressionPort,
      skillsPort: appDependencies.skillsPort,
      getControls: () => appDependencies.settingsPort.getSettings().controls,
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroyHud();
      this.destroyCharacterMenu();
      this.destroyPauseMenu();
    });
  }

  private handleCharacterMenuInput(): boolean {
    if (this.isPaused || this.isRespawning || this.isCompleting || this.isTransitioning) {
      return false;
    }

    if (this.isCharacterMenuOpen && Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.closeCharacterMenu();
      return true;
    }

    if (this.isCharacterMenuOpen && this.deps.gamepadReader.wasButtonJustPressed(GAMEPAD_BUTTON.B)) {
      this.closeCharacterMenu();
      return true;
    }

    if (this.deps.gamepadReader.wasButtonJustPressed(GAMEPAD_BUTTON.BACK)) {
      if (this.isCharacterMenuOpen) {
        this.closeCharacterMenu();
      } else {
        this.openCharacterMenu(this.lastCharacterMenuTabId);
      }
      return true;
    }

    if (this.isCharacterMenuOpen) {
      if (this.deps.gamepadReader.wasButtonJustPressed(GAMEPAD_BUTTON.LB)) {
        this.cycleCharacterMenuTab(-1);
        return true;
      }

      if (this.deps.gamepadReader.wasButtonJustPressed(GAMEPAD_BUTTON.RB)) {
        this.cycleCharacterMenuTab(1);
        return true;
      }
    }

    for (const tab of CHARACTER_MENU_TABS) {
      const keyboard = this.input.keyboard;
      if (!keyboard) {
        continue;
      }

      if (isActionJustDown(keyboard, this.getCharacterMenuBinding(tab.id), this.hotkeyCache)) {
        this.toggleCharacterMenuTab(tab.id);
        return true;
      }
    }

    return this.isCharacterMenuOpen;
  }

  private cycleCharacterMenuTab(delta: number): void {
    const currentTab = this.characterMenuOverlay?.getActiveTab() ?? this.lastCharacterMenuTabId;
    const nextTab = getTabByIndex(getTabIndex(currentTab) + delta);
    this.lastCharacterMenuTabId = nextTab.id;
    this.characterMenuOverlay?.setActiveTab(nextTab.id);
  }

  private openCharacterMenu(tabId: CharacterMenuTabId): void {
    if (this.isRespawning || this.isCompleting || this.isTransitioning) {
      return;
    }

    if (!this.characterMenuOverlay) {
      const appDependencies = getAppDependenciesFromRegistry(this);
      this.characterMenuOverlay = createCharacterMenuOverlay(this, {
        statsPort: appDependencies.playerStatsPort,
        skillsPort: appDependencies.skillsPort,
      });
    }

    this.characterMenuOverlay.setActiveTab(tabId);
    this.lastCharacterMenuTabId = tabId;
    this.isCharacterMenuOpen = true;
  }

  private closeCharacterMenu(): void {
    this.isCharacterMenuOpen = false;
    this.destroyCharacterMenu();
  }

  private toggleCharacterMenuTab(tabId: CharacterMenuTabId): void {
    if (!this.isCharacterMenuOpen) {
      this.openCharacterMenu(tabId);
      return;
    }

    if (this.characterMenuOverlay?.getActiveTab() === tabId) {
      this.closeCharacterMenu();
      return;
    }

    this.characterMenuOverlay?.setActiveTab(tabId);
    this.lastCharacterMenuTabId = tabId;
  }

  private destroyCharacterMenu(): void {
    this.characterMenuOverlay?.destroy();
    this.characterMenuOverlay = undefined;
    this.isCharacterMenuOpen = false;
  }

  private openPauseMenu(): void {
    if (this.isRespawning || this.isCompleting || this.isTransitioning || this.isPaused) {
      return;
    }

    this.closeCharacterMenu();

    this.pauseMenuOverlay = createPauseMenuOverlay(this, {
      onSettings: () => this.openSettingsFromPause(),
      onSave: () => this.saveFromPause(),
      onCheckpoint: () => this.restartFromCheckpoint(),
      onExit: () => this.exitToMainMenu(),
    });
    this.isPaused = true;
  }

  private closePauseMenu(): void {
    this.isPaused = false;
    this.destroyPauseMenu();
  }

  private destroyPauseMenu(): void {
    this.pauseMenuOverlay?.destroy();
    this.pauseMenuOverlay = undefined;
  }

  private openSettingsFromPause(): void {
    // Pause overlay keeps its MenuList input handler alive; Enter/Space would re-launch
    // Settings and reset selection to Master Volume via SettingsScene.init().
    this.destroyPauseMenu();
    this.scene.launch(SceneKeys.Settings, { returnScene: SceneKeys.Game });
    this.scene.pause();
  }

  private saveFromPause(): void {
    const appDependencies = getAppDependenciesFromRegistry(this);
    appDependencies.saveGame.execute({
      slotId: DEFAULT_SAVE_SLOT_ID,
      levelId: this.levelId,
      currentRoomId: this.currentRoomId,
    });
  }

  private restartFromCheckpoint(): void {
    this.closePauseMenu();
    this.respawnPlayer();
  }

  private exitToMainMenu(): void {
    const appDependencies = getAppDependenciesFromRegistry(this);
    appDependencies.saveGame.execute({
      slotId: DEFAULT_SAVE_SLOT_ID,
      levelId: this.levelId,
      currentRoomId: this.currentRoomId,
    });
    this.scene.start(SceneKeys.MainMenu);
  }

  private spawnEnemies(): void {
    this.deps.enemyPort.spawnEnemies(this.level.enemySpawns);

    for (const enemy of this.deps.enemyPort.getEnemies()) {
      const sprite = EnemySprite.create(
        this,
        enemy.archetypeId,
        enemy.position.x,
        enemy.position.y,
      );
      this.enemySprites.set(enemy.id, sprite);
    }
  }

  private updateFacingDirection(): void {
    if (this.playerState.velocity.x < 0) {
      this.facingDirection = -1;
    } else if (this.playerState.velocity.x > 0) {
      this.facingDirection = 1;
    }
  }

  private handleCombat(delta: number): void {
    const attackResult = this.deps.executeMeleeAttack.execute({
      playerPosition: this.playerState.position,
      facingDirection: this.facingDirection,
      attackPressed: this.deps.inputPort.isAttackPressed(),
      deltaMs: delta,
    });

    for (const kill of attackResult.enemiesKilled) {
      this.addExperience.execute(kill.killXp);
      this.destroyEnemySprite(kill.enemyId);
    }

    const hurtEnemyIds = new Set(attackResult.enemiesHit);
    this.syncEnemySprites(hurtEnemyIds);
    this.updateAttackFeedback();

    const enemyUpdateResult = this.deps.updateEnemies.execute({
      playerPosition: this.playerState.position,
      deltaMs: delta,
    });

    if (enemyUpdateResult.contactDamageApplied || enemyUpdateResult.projectileDamageApplied) {
      if (!enemyUpdateResult.survived) {
        this.goToGameOver();
        return;
      }

      this.respawnPlayer();
      return;
    }

    this.syncEnemySprites(hurtEnemyIds);
    this.syncProjectileSprites();
  }

  private syncEnemySprites(hurtEnemyIds: ReadonlySet<string> = new Set()): void {
    const projectileOwners = new Set(
      this.deps.enemyPort.getProjectiles().map((projectile) => projectile.ownerEnemyId),
    );

    for (const enemy of this.deps.enemyPort.getEnemies()) {
      const sprite = this.enemySprites.get(enemy.id);
      const context = {
        hasActiveProjectile: projectileOwners.has(enemy.id),
        isHurt: hurtEnemyIds.has(enemy.id),
      };

      if (!sprite) {
        const created = EnemySprite.create(
          this,
          enemy.archetypeId,
          enemy.position.x,
          enemy.position.y,
        );
        this.enemySprites.set(enemy.id, created);
        created.syncFromState(enemy, context);
        continue;
      }

      sprite.syncFromState(enemy, context);
    }
  }

  private syncProjectileSprites(): void {
    const activeIds = new Set(this.deps.enemyPort.getProjectiles().map((p) => p.id));

    for (const [id, sprite] of this.projectileSprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.projectileSprites.delete(id);
      }
    }

    for (const projectile of this.deps.enemyPort.getProjectiles()) {
      const sprite = this.projectileSprites.get(projectile.id);

      if (!sprite) {
        const created = new ProjectileSprite(
          this,
          projectile.position.x,
          projectile.position.y,
        );
        this.projectileSprites.set(projectile.id, created);
        created.syncFromState(projectile);
        continue;
      }

      sprite.syncFromState(projectile);
    }
  }

  private destroyProjectileSprites(): void {
    for (const sprite of this.projectileSprites.values()) {
      sprite.destroy();
    }

    this.projectileSprites.clear();
  }

  private updateAttackFeedback(): void {
    const attackState = this.deps.combatPort.getAttackState();

    if (!this.combatRules.isAttackActive(attackState)) {
      this.destroyAttackFeedback();
      return;
    }

    const hitbox = this.combatRules.computeHitbox(
      this.playerState.position.x,
      this.playerState.position.y,
      attackState.facingDirection,
    );
    const centerX = hitbox.x + hitbox.width / 2;
    const centerY = hitbox.y + hitbox.height / 2;

    if (!this.attackHitboxFeedback) {
      this.attackHitboxFeedback = this.add
        .sprite(centerX, centerY, AssetKeys.VfxMeleeSlash)
        .setDepth(4);
      this.attackHitboxFeedback.play(VFX_MELEE_SLASH_ANIM_KEY, true);
    } else {
      this.attackHitboxFeedback.setPosition(centerX, centerY);
    }

    this.attackHitboxFeedback.setDisplaySize(hitbox.width, hitbox.height);
    this.attackHitboxFeedback.setFlipX(attackState.facingDirection < 0);
    this.attackHitboxFeedback.setVisible(true);
  }

  private destroyEnemySprite(enemyId: string): void {
    const sprite = this.enemySprites.get(enemyId);

    if (!sprite) {
      return;
    }

    sprite.destroy();
    this.enemySprites.delete(enemyId);
    this.deps.enemyPort.removeEnemy(enemyId);
  }

  private destroyEnemySprites(): void {
    for (const sprite of this.enemySprites.values()) {
      sprite.destroy();
    }

    this.enemySprites.clear();
  }

  private destroyAttackFeedback(): void {
    this.attackHitboxFeedback?.destroy();
    this.attackHitboxFeedback = undefined;
  }

  private renderLevelObjects(): void {
    for (const hazard of this.level.hazards) {
      this.addLevelProp(
        AssetKeys.PropHazard,
        hazard.position.x + hazard.width / 2,
        hazard.position.y + hazard.height / 2,
        hazard.width,
        hazard.height,
        'fill',
      );
    }

    for (const checkpoint of this.level.checkpoints) {
      this.addLevelProp(
        AssetKeys.PropCheckpoint,
        checkpoint.position.x + checkpoint.width / 2,
        checkpoint.position.y + checkpoint.height / 2,
        checkpoint.width,
        checkpoint.height,
        'contain',
      );
    }

    for (const exit of this.level.exits) {
      this.addLevelProp(
        AssetKeys.PropExit,
        exit.position.x + exit.width / 2,
        exit.position.y + exit.height / 2,
        exit.width,
        exit.height,
        'contain',
      );
    }

    for (const door of this.level.doors) {
      this.addLevelProp(
        AssetKeys.PropDoor,
        door.bounds.x + door.bounds.width / 2,
        door.bounds.y + door.bounds.height / 2,
        door.bounds.width,
        door.bounds.height,
        'contain',
      );
    }

    for (const boundaryExit of this.level.boundaryExits) {
      this.levelObjectVisuals.push(
        this.add
          .rectangle(
            boundaryExit.bounds.x + boundaryExit.bounds.width / 2,
            boundaryExit.bounds.y + boundaryExit.bounds.height / 2,
            boundaryExit.bounds.width,
            boundaryExit.bounds.height,
            0xa855f7,
            0.45,
          )
          .setDepth(2),
      );
    }
  }

  private addLevelProp(
    textureKey: string,
    centerX: number,
    centerY: number,
    boxWidth: number,
    boxHeight: number,
    fit: 'fill' | 'contain',
  ): void {
    const image = this.add.image(centerX, centerY, textureKey).setDepth(2);

    if (fit === 'fill') {
      image.setDisplaySize(boxWidth, boxHeight);
    } else {
      const size = containSize(image.width, image.height, boxWidth, boxHeight);
      image.setDisplaySize(size.width, size.height);
    }

    this.levelObjectVisuals.push(image);
  }

  private clearLevelObjectVisuals(): void {
    for (const visual of this.levelObjectVisuals) {
      visual.destroy();
    }

    this.levelObjectVisuals.length = 0;
  }

  private spawnPlayer(position: Vector2): void {
    if (this.playerSprite) {
      this.playerSprite.sprite.destroy();
    }

    const appDependencies = getAppDependenciesFromRegistry(this);
    this.playerSprite = new PlayerSprite(
      this,
      position.x,
      position.y,
      appDependencies.settingsPort,
    );
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
        this.completeLevel();
        return;
      }
    }

    for (const door of this.level.doors) {
      if (
        overlapsPlayerAabb(
          x,
          y,
          door.bounds.x,
          door.bounds.y,
          door.bounds.width,
          door.bounds.height,
        )
      ) {
        if (this.deps.inputPort.isInteractPressed()) {
          void this.triggerDoorTransition(door.id);
        }

        return;
      }
    }

    for (const boundaryExit of this.level.boundaryExits) {
      if (
        overlapsPlayerAabb(
          x,
          y,
          boundaryExit.bounds.x,
          boundaryExit.bounds.y,
          boundaryExit.bounds.width,
          boundaryExit.bounds.height,
        )
      ) {
        void this.triggerBoundaryTransition(boundaryExit.id);
        return;
      }
    }
  }

  private triggerBoundaryTransition(exitId: string): void {
    if (this.isTransitioning) {
      return;
    }

    void this.deps.transitionThroughBoundary
      .execute({
        currentRoom: this.level,
        exitId,
      })
      .then((plan) => {
        this.transitionRoom(plan);
      })
      .catch((error: unknown) => {
        console.error('Boundary transition failed:', error);
      });
  }

  private triggerDoorTransition(doorId: string): void {
    if (this.isTransitioning) {
      return;
    }

    void this.deps.transitionThroughDoor
      .execute({
        currentRoom: this.level,
        doorId,
      })
      .then((plan) => {
        this.transitionRoom(plan);
      })
      .catch((error: unknown) => {
        console.error('Room transition failed:', error);
      });
  }

  private transitionRoom(plan: RoomTransitionPlan): void {
    if (this.isTransitioning) {
      return;
    }

    this.closeCharacterMenu();
    this.closePauseMenu();
    this.isTransitioning = true;
    const camera = this.cameras.main;

    camera.fadeOut(plan.fadeMs, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      void this.applyRoomTransition(plan)
        .then(() => {
          camera.fadeIn(plan.fadeMs, 0, 0, 0);
          camera.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
            this.isTransitioning = false;
          });
        })
        .catch((error: unknown) => {
          this.isTransitioning = false;
          console.error('Room transition failed:', error);
        });
    });
  }

  private async applyRoomTransition(plan: RoomTransitionPlan): Promise<void> {
    this.teardownRoomContent();
    await this.ensureRoomMapLoaded(plan.targetRoomId);

    this.currentRoomId = plan.targetRoomId;
    this.levelId = plan.targetRoomId;

    const cacheKey = mapCacheKey(this.currentRoomId);
    const cachedMap = this.cache.tilemap.get(cacheKey);
    if (!cachedMap) {
      throw new Error(`Tilemap "${cacheKey}" is not loaded.`);
    }

    this.level = this.deps.loadLevel.fromTiledMap(this.currentRoomId, cachedMap.data as TiledMapJson);
    this.buildRoomLayers(cacheKey);
    this.activatedCheckpointIds = new Set();

    this.renderLevelObjects();
    this.spawnEnemies();

    const spawnPosition = this.deps.levelCollisionResolver.resolveSpawnPosition(
      this.groundLayer!,
      plan.entryPosition,
    );
    this.respawnPosition = spawnPosition;
    this.spawnPlayer(spawnPosition);
    this.facingDirection = plan.facing === 'right' ? 1 : -1;
    this.playerSprite?.setFacing(this.facingDirection);

    this.setupCameraFollow();
    this.deps.cameraPort.reset();
    this.registry.set('currentLevelId', this.currentRoomId);
  }

  private teardownRoomContent(): void {
    this.groundLayer?.destroy();
    this.decorLayer?.destroy();
    this.tilemap?.destroy();
    this.groundLayer = undefined;
    this.decorLayer = undefined;
    this.tilemap = undefined;
    this.clearLevelObjectVisuals();
    this.destroyEnemySprites();
    this.destroyProjectileSprites();
    this.destroyAttackFeedback();
    this.deps.enemyPort.reset();
  }

  private ensureRoomMapLoaded(roomId: string): Promise<void> {
    const cacheKey = mapCacheKey(roomId);

    if (this.cache.tilemap.exists(cacheKey)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.load.tilemapTiledJSON(cacheKey, assetUrl(`assets/maps/${roomId}.json`));
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        resolve();
      });
      this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => {
        reject(new Error(`Failed to load room map "${roomId}".`));
      });
      this.load.start();
    });
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

    this.closeCharacterMenu();
    this.closePauseMenu();
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

  private completeLevel(): void {
    if (this.isCompleting) {
      return;
    }

    this.closeCharacterMenu();
    this.closePauseMenu();
    this.isCompleting = true;
    const camera = this.cameras.main;
    const nextLevelId = getNextLevelId(this.levelId);

    camera.fadeOut(LEVEL_COMPLETE_FADE_OUT_MS, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKeys.LevelComplete, {
        levelId: this.levelId,
        nextLevelId,
      });
    });
  }

  private goToGameOver(): void {
    this.scene.start(SceneKeys.GameOver, { levelId: this.levelId });
  }
}
