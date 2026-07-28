export class CameraScrollState {
  constructor(
    readonly scrollX: number,
    readonly scrollY: number,
    readonly lastHorizontalSign: -1 | 0 | 1,
    readonly dampeningRemainingMs: number,
    readonly previousPlayerX: number,
  ) {}

  static initial(scrollX = 0, scrollY = 0, previousPlayerX = 0): CameraScrollState {
    return new CameraScrollState(scrollX, scrollY, 0, 0, previousPlayerX);
  }

  withScroll(scrollX: number, scrollY: number): CameraScrollState {
    return new CameraScrollState(
      scrollX,
      scrollY,
      this.lastHorizontalSign,
      this.dampeningRemainingMs,
      this.previousPlayerX,
    );
  }

  withFollowTracking(
    lastHorizontalSign: -1 | 0 | 1,
    dampeningRemainingMs: number,
    previousPlayerX: number,
  ): CameraScrollState {
    return new CameraScrollState(
      this.scrollX,
      this.scrollY,
      lastHorizontalSign,
      dampeningRemainingMs,
      previousPlayerX,
    );
  }
}
