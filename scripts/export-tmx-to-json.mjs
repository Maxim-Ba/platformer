import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * Exports a Tiled TMX (CSV layers) to Phaser-compatible JSON, copying `tilesets`
 * from an already-exported map so embedded beast_soldier metadata stays intact.
 *
 * Usage:
 *   node scripts/export-tmx-to-json.mjs tiled/level-01.tmx public/assets/maps/level-01.json --tilesets-from public/assets/maps/room-a.json
 */
function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1];
}

function parseCsvData(xml) {
  return xml
    .trim()
    .split(/[\s,]+/)
    .filter((token) => token.length > 0)
    .map((token) => Number(token));
}

function parseProperties(xml) {
  const properties = [];
  const re = /<property\b([^/]*)\/>/g;
  let match = re.exec(xml);
  while (match) {
    const raw = match[1] ?? '';
    const name = attr(raw, 'name');
    const type = attr(raw, 'type') ?? 'string';
    const valueRaw = attr(raw, 'value') ?? '';
    if (name === undefined) {
      match = re.exec(xml);
      continue;
    }
    let value = valueRaw;
    if (type === 'bool') {
      value = valueRaw === 'true';
    } else if (type === 'int' || type === 'float') {
      value = Number(valueRaw);
    }
    properties.push({ name, type, value });
    match = re.exec(xml);
  }
  return properties;
}

function parseTileLayers(tmx) {
  const layers = [];
  const re = /<layer\b([^>]*)>([\s\S]*?)<\/layer>/g;
  let match = re.exec(tmx);
  while (match) {
    const head = match[1] ?? '';
    const body = match[2] ?? '';
    const dataXml = body.match(/<data encoding="csv">([\s\S]*?)<\/data>/)?.[1];
    if (dataXml === undefined) {
      throw new Error(`Layer "${attr(head, 'name') ?? '?'}" is missing CSV data`);
    }
    const propertiesXml = body.match(/<properties>([\s\S]*?)<\/properties>/)?.[1];
    const visible = attr(head, 'visible') !== '0';
    const layer = {
      data: parseCsvData(dataXml),
      height: Number(attr(head, 'height')),
      id: Number(attr(head, 'id')),
      name: attr(head, 'name'),
      opacity: 1,
      type: 'tilelayer',
      visible,
      width: Number(attr(head, 'width')),
      x: 0,
      y: 0,
    };
    if (propertiesXml !== undefined) {
      layer.properties = parseProperties(propertiesXml);
    }
    layers.push(layer);
    match = re.exec(tmx);
  }
  return layers;
}

function parseObject(head, innerXml) {
  const object = {
    height: Number(attr(head, 'height')),
    id: Number(attr(head, 'id')),
    name: attr(head, 'name') ?? '',
    type: attr(head, 'type') ?? '',
    visible: attr(head, 'visible') !== '0',
    width: Number(attr(head, 'width')),
    x: Number(attr(head, 'x')),
    y: Number(attr(head, 'y')),
  };
  if (innerXml !== undefined) {
    const propertiesXml = innerXml.match(/<properties>([\s\S]*?)<\/properties>/)?.[1];
    if (propertiesXml !== undefined) {
      object.properties = parseProperties(propertiesXml);
    }
  }
  return object;
}

function parseObjectGroup(tmx) {
  const groupMatch = tmx.match(/<objectgroup\b([^>]*)>([\s\S]*?)<\/objectgroup>/);
  if (groupMatch === null) {
    throw new Error('TMX is missing objectgroup');
  }
  const head = groupMatch[1] ?? '';
  const body = groupMatch[2] ?? '';
  const objects = [];
  const emptyRe = /<object\b([^>]*)\/>/g;
  let empty = emptyRe.exec(body);
  while (empty) {
    objects.push(parseObject(empty[1] ?? ''));
    empty = emptyRe.exec(body);
  }
  const fullRe = /<object\b((?:[^>/]|\/(?!>))*)>([\s\S]*?)<\/object>/g;
  let full = fullRe.exec(body);
  while (full) {
    objects.push(parseObject(full[1] ?? '', full[2] ?? ''));
    full = fullRe.exec(body);
  }
  objects.sort((a, b) => a.id - b.id);
  return {
    draworder: 'topdown',
    id: Number(attr(head, 'id')),
    name: attr(head, 'name') ?? 'objects',
    objects,
    opacity: 1,
    type: 'objectgroup',
    visible: attr(head, 'visible') !== '0',
    x: 0,
    y: 0,
  };
}

function parseMapHead(tmx) {
  const match = tmx.match(/<map\b([^>]*)>/);
  if (match === null) {
    throw new Error('TMX is missing <map>');
  }
  const head = match[1] ?? '';
  return {
    height: Number(attr(head, 'height')),
    nextlayerid: Number(attr(head, 'nextlayerid')),
    nextobjectid: Number(attr(head, 'nextobjectid')),
    orientation: attr(head, 'orientation') ?? 'orthogonal',
    renderorder: attr(head, 'renderorder') ?? 'right-down',
    tiledversion: attr(head, 'tiledversion') ?? '1.12.2',
    tileheight: Number(attr(head, 'tileheight')),
    tilewidth: Number(attr(head, 'tilewidth')),
    version: attr(head, 'version') ?? '1.10',
    width: Number(attr(head, 'width')),
  };
}

function loadTilesets(tilesetsFromPath) {
  const parsed = JSON.parse(fs.readFileSync(tilesetsFromPath, 'utf8'));
  if (!Array.isArray(parsed.tilesets) || parsed.tilesets.length === 0) {
    throw new Error(`${tilesetsFromPath} has no tilesets array`);
  }
  return parsed.tilesets;
}

const tmxPath = process.argv[2];
const outPath = process.argv[3];
const tilesetsFlag = process.argv.indexOf('--tilesets-from');
const tilesetsFrom = tilesetsFlag >= 0 ? process.argv[tilesetsFlag + 1] : undefined;

if (tmxPath === undefined || outPath === undefined || tilesetsFrom === undefined) {
  process.stderr.write(
    'Usage: node scripts/export-tmx-to-json.mjs <in.tmx> <out.json> --tilesets-from <map.json>\n',
  );
  process.exit(1);
}

const tmx = fs.readFileSync(tmxPath, 'utf8');
const head = parseMapHead(tmx);
const map = {
  compressionlevel: -1,
  height: head.height,
  infinite: false,
  layers: [...parseTileLayers(tmx), parseObjectGroup(tmx)],
  nextlayerid: head.nextlayerid,
  nextobjectid: head.nextobjectid,
  orientation: head.orientation,
  renderorder: head.renderorder,
  tiledversion: head.tiledversion,
  tileheight: head.tileheight,
  tilesets: loadTilesets(tilesetsFrom),
  tilewidth: head.tilewidth,
  type: 'map',
  version: head.version,
  width: head.width,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(map, null, 2)}\n`);
