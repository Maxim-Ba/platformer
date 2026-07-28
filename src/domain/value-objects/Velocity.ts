export class Velocity {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  withX(x: number): Velocity {
    return new Velocity(x, this.y);
  }

  withY(y: number): Velocity {
    return new Velocity(this.x, y);
  }
}
