export class Vector2 {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }
}
