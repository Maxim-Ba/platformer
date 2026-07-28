export class CameraFollowConfig {
  constructor(
    readonly baseLerp: number,
    readonly directionChangeLerp: number,
    readonly directionChangeDurationMs: number,
  ) {}

  static readonly defaults = new CameraFollowConfig(0.12, 0.04, 200);
}
