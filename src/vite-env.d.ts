/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Empty / unset in local Vite; `/media/` in production so Phaser loads from MinIO. */
  readonly VITE_ASSET_BASE_URL?: string;
}
