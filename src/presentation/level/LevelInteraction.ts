export function overlapsPlayerAabb(
  playerX: number,
  playerFeetY: number,
  objectX: number,
  objectY: number,
  objectWidth: number,
  objectHeight: number,
  playerWidth = 24,
  playerHeight = 48,
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
