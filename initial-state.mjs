import fs from 'node:fs';
import { parseWebURL } from './safe-proxy.mjs';

export function initialState(filename) {
  const empty = { revision: 1, layout: { rows: 4, columns: 5 }, openLinksIn: 'same-window', tiles: [] };
  if (!filename) return empty;
  try {
    if (fs.statSync(filename).size > 16 * 1024 * 1024) throw new Error();
    const input = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (!Array.isArray(input.tiles) || input.tiles.length > 500) throw new Error();
    const layout = input.layout || empty.layout;
    if (![layout.rows, layout.columns].every(n => Number.isInteger(n) && n >= 1 && n <= 12)) throw new Error();
    const openLinksIn = input.openLinksIn || empty.openLinksIn;
    if (!['same-window', 'new-window'].includes(openLinksIn)) throw new Error();
    const ids = new Set();
    const tiles = input.tiles.map(tile => {
      if (typeof tile.id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(tile.id) || ids.has(tile.id)) throw new Error();
      ids.add(tile.id);
      const url = parseWebURL(tile.url).href;
      const title = tile.title || new URL(url).hostname;
      if (typeof title !== 'string' || title.length > 300) throw new Error();
      const image = tile.image ?? null;
      if (image !== null && (typeof image !== 'string' || !/^\/(?:legacy\/)?images\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|gif|webp|svg)$/.test(image))) throw new Error();
      return { id: tile.id, title, url, image, screenshotStatus: 'ready', screenshotError: null };
    });
    return { ...empty, layout: { rows: layout.rows, columns: layout.columns }, openLinksIn, tiles };
  } catch { throw new Error('INITIAL_STATE_FILE must contain a valid Speed Dial seed'); }
}
