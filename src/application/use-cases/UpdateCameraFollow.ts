import { CameraFollowConfig } from '@domain/value-objects/CameraFollowConfig';
import { CameraScrollState } from '@domain/value-objects/CameraScrollState';

const REFERENCE_FRAME_MS = 16.67;

export interface UpdateCameraFollowInput {
  state: CameraScrollState;
  playerX: number;
  playerY: number;
  viewportWidth: number;
  viewportHeight: number;
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
  deltaMs: number;
  config?: CameraFollowConfig;
}

export interface UpdateCameraFollowResult {
  state: CameraScrollState;
  scrollX: number;
  scrollY: number;
}

function horizontalSign(deltaX: number): -1 | 0 | 1 {
  if (deltaX > 0) {
    return 1;
  }
  if (deltaX < 0) {
    return -1;
  }
  return 0;
}

function frameIndependentLerpFactor(lerp: number, deltaMs: number): number {
  return 1 - Math.pow(1 - lerp, deltaMs / REFERENCE_FRAME_MS);
}

function clampScroll(
  scrollX: number,
  scrollY: number,
  boundsX: number,
  boundsY: number,
  boundsWidth: number,
  boundsHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): { scrollX: number; scrollY: number } {
  const minX = Math.min(boundsX, boundsX + boundsWidth - viewportWidth);
  const maxX = Math.max(boundsX, boundsX + boundsWidth - viewportWidth);
  const minY = Math.min(boundsY, boundsY + boundsHeight - viewportHeight);
  const maxY = Math.max(boundsY, boundsY + boundsHeight - viewportHeight);

  return {
    scrollX: Math.min(Math.max(scrollX, minX), maxX),
    scrollY: Math.min(Math.max(scrollY, minY), maxY),
  };
}

function centeredTargetScroll(
  playerX: number,
  playerY: number,
  viewportWidth: number,
  viewportHeight: number,
): { targetX: number; targetY: number } {
  return {
    targetX: playerX - viewportWidth / 2,
    targetY: playerY - viewportHeight / 2,
  };
}

export class UpdateCameraFollow {
  execute({
    state,
    playerX,
    playerY,
    viewportWidth,
    viewportHeight,
    boundsX,
    boundsY,
    boundsWidth,
    boundsHeight,
    deltaMs,
    config = CameraFollowConfig.defaults,
  }: UpdateCameraFollowInput): UpdateCameraFollowResult {
    const movementSign = horizontalSign(playerX - state.previousPlayerX);
    let dampeningRemainingMs = Math.max(0, state.dampeningRemainingMs - deltaMs);
    let lastHorizontalSign = state.lastHorizontalSign;

    if (
      movementSign !== 0 &&
      lastHorizontalSign !== 0 &&
      movementSign !== lastHorizontalSign
    ) {
      dampeningRemainingMs = config.directionChangeDurationMs;
    }

    if (movementSign !== 0) {
      lastHorizontalSign = movementSign;
    }

    const lerpX =
      dampeningRemainingMs > 0 ? config.directionChangeLerp : config.baseLerp;
    const lerpY = config.baseLerp;
    const tX = frameIndependentLerpFactor(lerpX, deltaMs);
    const tY = frameIndependentLerpFactor(lerpY, deltaMs);

    const { targetX, targetY } = centeredTargetScroll(
      playerX,
      playerY,
      viewportWidth,
      viewportHeight,
    );

    const nextScroll = clampScroll(
      state.scrollX + (targetX - state.scrollX) * tX,
      state.scrollY + (targetY - state.scrollY) * tY,
      boundsX,
      boundsY,
      boundsWidth,
      boundsHeight,
      viewportWidth,
      viewportHeight,
    );

    return {
      scrollX: nextScroll.scrollX,
      scrollY: nextScroll.scrollY,
      state: state
        .withScroll(nextScroll.scrollX, nextScroll.scrollY)
        .withFollowTracking(lastHorizontalSign, dampeningRemainingMs, playerX),
    };
  }

  snapToTarget({
    playerX,
    playerY,
    viewportWidth,
    viewportHeight,
    boundsX,
    boundsY,
    boundsWidth,
    boundsHeight,
  }: Omit<UpdateCameraFollowInput, 'state' | 'deltaMs' | 'config'>): UpdateCameraFollowResult {
    const { targetX, targetY } = centeredTargetScroll(
      playerX,
      playerY,
      viewportWidth,
      viewportHeight,
    );
    const nextScroll = clampScroll(
      targetX,
      targetY,
      boundsX,
      boundsY,
      boundsWidth,
      boundsHeight,
      viewportWidth,
      viewportHeight,
    );

    return {
      scrollX: nextScroll.scrollX,
      scrollY: nextScroll.scrollY,
      state: CameraScrollState.initial(
        nextScroll.scrollX,
        nextScroll.scrollY,
        playerX,
      ),
    };
  }
}
