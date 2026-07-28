import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import type { PlayerState } from '@domain/value-objects/PlayerState';
import type { Vector2 } from '@domain/value-objects/Vector2';
import type { Velocity } from '@domain/value-objects/Velocity';
import Phaser from 'phaser';

type DynamicArcadeObject = Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody;

export class PhaserPhysicsAdapter implements IPhysicsPort {
  private readonly entities = new Map<string, DynamicArcadeObject>();

  constructor(private readonly scene: Phaser.Scene) {}

  setGravity(gravityY: number): void {
    this.scene.physics.world.gravity.y = gravityY;
  }

  registerEntity(entityId: string, gameObject: object): void {
    const arcadeObject = gameObject as DynamicArcadeObject;
    const body = arcadeObject.body;
    if (!body) {
      return;
    }

    body.allowGravity = false;
    body.moves = false;
    body.setVelocity(0, 0);
    this.entities.set(entityId, arcadeObject);
  }

  applyVelocity(entityId: string, velocity: Velocity): void {
    void entityId;
    void velocity;
  }

  setPosition(entityId: string, position: Vector2): void {
    void entityId;
    void position;
  }

  syncFromDomain(entityId: string, state: PlayerState): void {
    void state;
    const body = this.getBody(entityId);
    if (!body) {
      return;
    }

    body.setVelocity(0, 0);
    body.updateFromGameObject();
  }

  isGrounded(entityId: string): boolean {
    const body = this.getBody(entityId);
    if (!body) {
      return false;
    }

    return body.blocked.down || body.touching.down;
  }

  private getBody(entityId: string): Phaser.Physics.Arcade.Body | undefined {
    return this.entities.get(entityId)?.body;
  }
}
