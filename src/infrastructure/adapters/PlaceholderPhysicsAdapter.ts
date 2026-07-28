import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import type { PlayerState } from '@domain/value-objects/PlayerState';
import type { Vector2 } from '@domain/value-objects/Vector2';
import type { Velocity } from '@domain/value-objects/Velocity';

export class PlaceholderPhysicsAdapter implements IPhysicsPort {
  setGravity(gravityY: number): void {
    void gravityY;
    // Placeholder: real Phaser adapter will wire arcade physics in a later change.
  }

  registerEntity(entityId: string, gameObject: object): void {
    void entityId;
    void gameObject;
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
    void entityId;
    void state;
  }

  isGrounded(entityId: string): boolean {
    void entityId;
    return false;
  }
}
