import type {
  CameraBounds,
  CameraFollowTarget,
  CameraFollowTargetResolver,
  ICameraPort,
} from '@application/ports/ICameraPort';
import { UpdateCameraFollow } from '@application/use-cases/UpdateCameraFollow';
import { CameraFollowConfig } from '@domain/value-objects/CameraFollowConfig';
import { CameraScrollState } from '@domain/value-objects/CameraScrollState';
import type Phaser from 'phaser';

function resolveTarget(
  target: CameraFollowTarget | CameraFollowTargetResolver,
): CameraFollowTarget {
  return typeof target === 'function' ? target() : target;
}

export class PhaserSmoothCameraAdapter implements ICameraPort {
  private targetResolver?: CameraFollowTargetResolver;
  private bounds: CameraBounds = { x: 0, y: 0, width: 0, height: 0 };
  private viewportWidth = 0;
  private viewportHeight = 0;
  private scrollState = CameraScrollState.initial();
  private readonly updateCameraFollow = new UpdateCameraFollow();

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    private readonly config: CameraFollowConfig = CameraFollowConfig.defaults,
  ) {
    this.camera.roundPixels = true;
    this.camera.stopFollow();
  }

  attach(target: CameraFollowTarget | CameraFollowTargetResolver): void {
    this.targetResolver =
      typeof target === 'function' ? target : () => ({ x: target.x, y: target.y });
    this.camera.stopFollow();
    this.reset();
  }

  setBounds(bounds: CameraBounds): void {
    this.bounds = bounds;
    this.applyPhaserBounds();
  }

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.applyPhaserBounds();
  }

  private applyPhaserBounds(): void {
    if (this.viewportWidth === 0 || this.viewportHeight === 0) {
      return;
    }

    const worldExceedsViewport =
      this.bounds.width > this.viewportWidth ||
      this.bounds.height > this.viewportHeight;

    if (worldExceedsViewport) {
      this.camera.setBounds(
        this.bounds.x,
        this.bounds.y,
        this.bounds.width,
        this.bounds.height,
      );
      return;
    }

    this.camera.removeBounds();
  }

  update(deltaMs: number): void {
    if (!this.targetResolver || this.viewportWidth === 0 || this.viewportHeight === 0) {
      return;
    }

    const target = resolveTarget(this.targetResolver);
    const result = this.updateCameraFollow.execute({
      state: this.scrollState,
      playerX: target.x,
      playerY: target.y,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      boundsX: this.bounds.x,
      boundsY: this.bounds.y,
      boundsWidth: this.bounds.width,
      boundsHeight: this.bounds.height,
      deltaMs,
      config: this.config,
    });

    this.scrollState = result.state;
    this.camera.setScroll(result.scrollX, result.scrollY);
  }

  reset(scrollX?: number, scrollY?: number): void {
    if (!this.targetResolver) {
      return;
    }

    const target = resolveTarget(this.targetResolver);

    if (scrollX !== undefined && scrollY !== undefined) {
      this.scrollState = CameraScrollState.initial(scrollX, scrollY, target.x);
      this.camera.setScroll(scrollX, scrollY);
      return;
    }

    const result = this.updateCameraFollow.snapToTarget({
      playerX: target.x,
      playerY: target.y,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      boundsX: this.bounds.x,
      boundsY: this.bounds.y,
      boundsWidth: this.bounds.width,
      boundsHeight: this.bounds.height,
    });

    this.scrollState = result.state;
    this.camera.setScroll(result.scrollX, result.scrollY);
  }
}
