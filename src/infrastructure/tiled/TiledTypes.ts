export interface TiledProperty {
  readonly name: string;
  readonly type: string;
  readonly value: boolean | number | string;
}

export interface TiledObject {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly visible?: boolean;
  readonly properties?: readonly TiledProperty[];
}

export interface TiledObjectGroup {
  readonly name: string;
  readonly type: 'objectgroup';
  readonly objects: readonly TiledObject[];
}

export interface TiledTileLayer {
  readonly name: string;
  readonly type: 'tilelayer';
  readonly width: number;
  readonly height: number;
  readonly data: readonly number[];
}

export interface TiledTileDefinition {
  readonly id: number;
  readonly properties?: readonly TiledProperty[];
}

export interface TiledTileset {
  readonly firstgid: number;
  readonly name: string;
  readonly tilewidth: number;
  readonly tileheight: number;
  readonly tiles?: readonly TiledTileDefinition[];
}

export type TiledLayer = TiledTileLayer | TiledObjectGroup;

export interface TiledMapJson {
  readonly width: number;
  readonly height: number;
  readonly tilewidth: number;
  readonly tileheight: number;
  readonly layers: readonly TiledLayer[];
  readonly tilesets: readonly TiledTileset[];
}
