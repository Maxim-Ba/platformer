export interface HudWidget {
  readonly id: string;
  update(): void;
  setPosition(x: number, y: number): void;
  destroy(): void;
}
