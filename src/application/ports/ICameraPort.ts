export interface CameraBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CameraFollowTarget {
  readonly x: number;
  readonly y: number;
}

export type CameraFollowTargetResolver = () => CameraFollowTarget;

export interface ICameraPort {
  attach(target: CameraFollowTarget | CameraFollowTargetResolver): void;
  setBounds(bounds: CameraBounds): void;
  setViewportSize(width: number, height: number): void;
  update(deltaMs: number): void;
  reset(scrollX?: number, scrollY?: number): void;
}
