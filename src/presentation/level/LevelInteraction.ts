import {
  PLAYER_COLLISION_HEIGHT,
  PLAYER_COLLISION_WIDTH,
} from '@domain/constants/player';

export function overlapsPlayerAabb(
  playerX: number,
  playerFeetY: number,
  objectX: number,
  objectY: number,
  objectWidth: number,
  objectHeight: number,
  playerWidth = PLAYER_COLLISION_WIDTH,
  playerHeight = PLAYER_COLLISION_HEIGHT,
): boolean {
  const playerLeft = playerX - playerWidth / 2;
  const playerRight = playerX + playerWidth / 2;
  const playerTop = playerFeetY - playerHeight;
  const playerBottom = playerFeetY;

  return (
    playerRight > objectX &&
    playerLeft < objectX + objectWidth &&
    playerBottom > objectY &&
    playerTop < objectY + objectHeight
  );
}
