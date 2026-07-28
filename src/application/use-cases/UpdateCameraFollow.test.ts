import { describe, expect, it } from 'vitest';

import { CameraFollowConfig } from '@domain/value-objects/CameraFollowConfig';
import { CameraScrollState } from '@domain/value-objects/CameraScrollState';

import { UpdateCameraFollow } from './UpdateCameraFollow';

const VIEWPORT = { width: 1920, height: 1080 };
const BOUNDS = { x: 0, y: 0, width: 6400, height: 1080 };
const FRAME_MS = 16;
const useCase = new UpdateCameraFollow();
const config = CameraFollowConfig.defaults;

function executeFrame(
  state: CameraScrollState,
  playerX: number,
  playerY: number,
): CameraScrollState {
  return useCase.execute({
    state,
    playerX,
    playerY,
    viewportWidth: VIEWPORT.width,
    viewportHeight: VIEWPORT.height,
    boundsX: BOUNDS.x,
    boundsY: BOUNDS.y,
    boundsWidth: BOUNDS.width,
    boundsHeight: BOUNDS.height,
    deltaMs: FRAME_MS,
    config,
  }).state;
}

describe('UpdateCameraFollow', () => {
  it('interpolates scroll toward centered target during steady movement', () => {
    const playerX = 2000;
    const start = CameraScrollState.initial(0, 0, playerX - 16);
    const next = executeFrame(start, playerX, 540);
    const targetScrollX = playerX - VIEWPORT.width / 2;

    expect(next.scrollX).toBeGreaterThan(0);
    expect(next.scrollX).toBeLessThan(targetScrollX);
    expect(next.scrollY).toBeCloseTo(0, 5);
  });

  it('applies slower horizontal follow while direction-change dampening is active', () => {
    const playerY = 540;
    const startScrollX = 1000;
    const sharedInput = {
      playerX: 3020,
      playerY,
      viewportWidth: VIEWPORT.width,
      viewportHeight: VIEWPORT.height,
      boundsX: BOUNDS.x,
      boundsY: BOUNDS.y,
      boundsWidth: BOUNDS.width,
      boundsHeight: BOUNDS.height,
      deltaMs: FRAME_MS,
      config,
    };

    const withDampening = useCase.execute({
      ...sharedInput,
      state: new CameraScrollState(startScrollX, 0, 1, config.directionChangeDurationMs, 3000),
    });
    const withoutDampening = useCase.execute({
      ...sharedInput,
      state: new CameraScrollState(startScrollX, 0, 1, 0, 3000),
    });

    const dampeningDelta = Math.abs(withDampening.scrollX - startScrollX);
    const normalDelta = Math.abs(withoutDampening.scrollX - startScrollX);

    expect(dampeningDelta).toBeLessThan(normalDelta);
  });

  it('clamps scroll to level bounds at edges', () => {
    const nearRightEdge = BOUNDS.width - 100;
    const result = useCase.snapToTarget({
      playerX: nearRightEdge,
      playerY: 540,
      viewportWidth: VIEWPORT.width,
      viewportHeight: VIEWPORT.height,
      boundsX: BOUNDS.x,
      boundsY: BOUNDS.y,
      boundsWidth: BOUNDS.width,
      boundsHeight: BOUNDS.height,
    });

    expect(result.scrollX).toBe(BOUNDS.width - VIEWPORT.width);
    expect(result.scrollX).toBeGreaterThanOrEqual(0);
  });

  it('decays direction-change dampening over time', () => {
    const start = new CameraScrollState(1000, 0, 1, config.directionChangeDurationMs, 2000);
    const afterDecay = useCase.execute({
      state: start,
      playerX: 2010,
      playerY: 540,
      viewportWidth: VIEWPORT.width,
      viewportHeight: VIEWPORT.height,
      boundsX: BOUNDS.x,
      boundsY: BOUNDS.y,
      boundsWidth: BOUNDS.width,
      boundsHeight: BOUNDS.height,
      deltaMs: config.directionChangeDurationMs + 1,
      config,
    });

    expect(afterDecay.state.dampeningRemainingMs).toBe(0);
  });

  it('scrolls when level is smaller than viewport (level-01 size)', () => {
    const levelBounds = { x: 0, y: 0, width: 1280, height: 640 };
    const playerX = 640;

    const result = useCase.snapToTarget({
      playerX,
      playerY: 544,
      viewportWidth: VIEWPORT.width,
      viewportHeight: VIEWPORT.height,
      boundsX: levelBounds.x,
      boundsY: levelBounds.y,
      boundsWidth: levelBounds.width,
      boundsHeight: levelBounds.height,
    });

    expect(result.scrollX).toBe(playerX - VIEWPORT.width / 2);
    expect(result.scrollX).toBeLessThan(0);
  });
});
