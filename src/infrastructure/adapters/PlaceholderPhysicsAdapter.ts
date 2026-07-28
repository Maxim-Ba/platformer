import type { IPhysicsPort } from '@application/ports/IPhysicsPort';

export class PlaceholderPhysicsAdapter implements IPhysicsPort {
  setGravity(gravityY: number): void {
    void gravityY;
    // Placeholder: real Phaser adapter will wire arcade physics in a later change.
  }
}
