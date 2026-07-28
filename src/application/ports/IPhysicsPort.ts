import type { PlayerState } from '@domain/value-objects/PlayerState';
import type { Vector2 } from '@domain/value-objects/Vector2';
import type { Velocity } from '@domain/value-objects/Velocity';

export interface IPhysicsPort {
  setGravity(gravityY: number): void;
  registerEntity(entityId: string, gameObject: object): void;
  applyVelocity(entityId: string, velocity: Velocity): void;
  setPosition(entityId: string, position: Vector2): void;
  syncFromDomain(entityId: string, state: PlayerState): void;
  isGrounded(entityId: string): boolean;
}
