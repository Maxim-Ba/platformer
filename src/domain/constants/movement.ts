export const GRAVITY = 2000;
export const PLAYER_SPEED = 200;
/** Upward velocity (px/s). Max height ≈ v² / (2 × GRAVITY) ≈ 194 px at defaults. */
export const JUMP_VELOCITY = -880;
export const COYOTE_TIME_MS = 100;
export const JUMP_BUFFER_MS = 100;

/** Apex height in pixels for the configured jump arc (no horizontal movement). */
export function maxJumpHeight(
  jumpVelocity = JUMP_VELOCITY,
  gravity = GRAVITY,
): number {
  return (jumpVelocity * jumpVelocity) / (2 * gravity);
}
