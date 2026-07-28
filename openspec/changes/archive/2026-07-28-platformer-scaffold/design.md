## Context

Этап 1 из 8. Greenfield bootstrap для 2D platformer pet-проекта. Референс — *Blasphemous*; стек — TypeScript + Vite + Phaser 3.

## Goals / Non-Goals

**Goals:**

- `npm run dev` запускает Phaser в браузере.
- `npm run build` собирает без ошибок.
- Full HD canvas 1920×1080, scale mode FIT, pixelArt true.
- ESLint + Prettier + strict TypeScript.

**Non-Goals:**

- Clean Architecture слои (этап 2).
- Gameplay, сцены, Tiled (этапы 3–8).

## Decisions

### Phaser GameConfig

- Width/height: **1920×1080**
- Scale: `Phaser.Scale.FIT`, centered
- Physics: `arcade`, gravity Y настраивается позже
- `pixelArt: true` — чёткое масштабирование pixel-art

### Asset layout

```
public/assets/
├── maps/
├── images/
└── audio/
    ├── sfx/
    └── music/
```

### Tooling

- Vite для dev/build
- ESLint flat config + Prettier
- Path aliases в tsconfig (`@domain/*`, `@application/*`, …) — подготовка к этапу 2

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Phaser + Vite config issues | Использовать проверенный шаблон import phaser |
| Scope creep в scaffold | Только минимальный canvas, без gameplay |
