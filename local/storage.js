'use strict';

// This adapter deliberately has no network transport. Board IDs identify a
// record in this browser profile; they are never an authentication credential.
(() => {
  const FORMAT = 'speedial-local-backup';
  const LIMITS = Object.freeze({ tiles: 500, imageBytes: 5 * 1024 * 1024, boardImageBytes: 60 * 1024 * 1024, backupBytes: 100 * 1024 * 1024, imagePixels: 40 * 1024 * 1024, imageDimension: 16384 });
  const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const LOCALES = new Set(['en', 'ru', 'de', 'fr', 'es']);
  const preparedBackups = new WeakMap();

  function fail(code, status = 400) { throw Object.assign(new Error(code), { code, status }); }
  function storageError(error) {
    if (error?.code && typeof error.code === 'string') return error;
    return Object.assign(new Error(error?.name === 'QuotaExceededError' ? 'QUOTA_EXCEEDED' : 'STORAGE_UNAVAILABLE'), {
      code: error?.name === 'QuotaExceededError' ? 'QUOTA_EXCEEDED' : 'STORAGE_UNAVAILABLE',
      status: error?.name === 'QuotaExceededError' ? 507 : 503,
    });
  }
  function fields(input) {
    if (typeof input.url !== 'string' || input.url.length > 4096 || /[\u0000-\u001f\u007f]/.test(input.url)) fail('INVALID_URL');
    let url;
    try { url = new URL(input.url); } catch { fail('INVALID_URL'); }
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.href.length > 4096) fail('INVALID_URL');
    if (input.title !== undefined && typeof input.title !== 'string') fail('INVALID_TITLE');
    const title = (input.title || '').trim() || url.hostname;
    if (title.length > 300) fail('TITLE_TOO_LONG');
    return { url: url.href, title };
  }
  function layout(value) {
    if (!value || ![value.rows, value.columns].every(n => Number.isInteger(n) && n >= 1 && n <= 12)) fail('INVALID_LAYOUT');
    return { rows: value.rows, columns: value.columns };
  }
  function linkTarget(value) {
    if (!['same-window', 'new-window'].includes(value)) fail('INVALID_LINK_TARGET');
    return value;
  }
  function exactKeys(value, required, optional = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype ||
        required.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) fail('INVALID_BACKUP');
  }
  function base64Bytes(value, maxBytes = LIMITS.imageBytes) {
    if (typeof value !== 'string' || value.length > Math.ceil(maxBytes / 3) * 4) fail('IMAGE_TOO_LARGE', 413);
    if (!value.length || value.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) fail('INVALID_IMAGE');
    let binary;
    try { binary = atob(value); } catch { fail('INVALID_IMAGE'); }
    if (binary.length > maxBytes) fail('IMAGE_TOO_LARGE', 413);
    if (btoa(binary) !== value) fail('INVALID_IMAGE');
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }
  function bytesBase64(bytes) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    return btoa(binary);
  }
  function imageDimensions(bytes, type) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 12) fail('INVALID_IMAGE');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const ascii = (offset, length) => String.fromCharCode(...bytes.subarray(offset, offset + length));
    let width, height;
    if (type === 'image/png') {
      if (bytes.length < 33 || ![137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n) || ascii(12, 4) !== 'IHDR' || view.getUint32(8) !== 13) fail('INVALID_IMAGE');
      width = view.getUint32(16); height = view.getUint32(20);
    } else if (type === 'image/gif') {
      if (!['GIF87a', 'GIF89a'].includes(ascii(0, 6))) fail('INVALID_IMAGE');
      width = view.getUint16(6, true); height = view.getUint16(8, true);
    } else if (type === 'image/jpeg') {
      if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) fail('INVALID_IMAGE');
      let offset = 2;
      while (offset < bytes.length) {
        if (bytes[offset++] !== 255) fail('INVALID_IMAGE');
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 0xda || marker === 0xd9 || offset + 2 > bytes.length) break;
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        const length = view.getUint16(offset);
        if (length < 2 || offset + length > bytes.length) fail('INVALID_IMAGE');
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
          if (length < 8) fail('INVALID_IMAGE');
          height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
        }
        offset += length;
      }
    } else if (type === 'image/webp') {
      if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP' || bytes.length < 30 || view.getUint32(4, true) + 8 !== bytes.length) fail('INVALID_IMAGE');
      const chunk = ascii(12, 4);
      if (chunk === 'VP8X') {
        width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
        height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      } else if (chunk === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
        width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff;
      } else if (chunk === 'VP8L' && bytes[20] === 0x2f) {
        const bits = view.getUint32(21, true);
        width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
      }
    } else fail('IMAGE_TYPE_UNSUPPORTED');
    if (!width || !height || width > LIMITS.imageDimension || height > LIMITS.imageDimension || width * height > LIMITS.imagePixels) fail('INVALID_IMAGE_SIZE');
    return { width, height };
  }
  async function decodeImage(blob) {
    if (typeof globalThis.createImageBitmap === 'function') {
      let bitmap;
      try {
        bitmap = await createImageBitmap(blob);
        if (!bitmap.width || !bitmap.height || bitmap.width > LIMITS.imageDimension || bitmap.height > LIMITS.imageDimension || bitmap.width * bitmap.height > LIMITS.imagePixels) fail('INVALID_IMAGE_SIZE');
      } catch (error) { if (typeof error?.code === 'string') throw error; fail('INVALID_IMAGE'); }
      finally { bitmap?.close(); }
      return;
    }
    if (typeof globalThis.Image !== 'function') fail('IMAGE_TYPE_UNSUPPORTED');
    const url = URL.createObjectURL(blob);
    try {
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > LIMITS.imageDimension || image.naturalHeight > LIMITS.imageDimension || image.naturalWidth * image.naturalHeight > LIMITS.imagePixels) reject(Object.assign(new Error('INVALID_IMAGE_SIZE'), { code: 'INVALID_IMAGE_SIZE', status: 400 }));
          else resolve();
        };
        image.onerror = () => reject(Object.assign(new Error('INVALID_IMAGE'), { code: 'INVALID_IMAGE', status: 400 }));
        image.src = url;
      });
    } finally { URL.revokeObjectURL(url); }
  }
  async function validateImage(value) {
    let blob = value;
    if (typeof value === 'string') {
      const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(value);
      if (!match) fail('IMAGE_TYPE_UNSUPPORTED');
      blob = new Blob([base64Bytes(match[2])], { type: match[1] });
    }
    if (!(blob instanceof Blob)) fail('IMAGE_REQUIRED');
    if (!TYPES.has(blob.type)) fail('IMAGE_TYPE_UNSUPPORTED');
    if (blob.size > LIMITS.imageBytes) fail('IMAGE_TOO_LARGE', 413);
    imageDimensions(new Uint8Array(await blob.arrayBuffer()), blob.type);
    await decodeImage(blob);
    return new Blob([blob], { type: blob.type });
  }
  function parseBackupDocument(text) {
    if (typeof text !== 'string') fail('INVALID_BACKUP');
    if (text.length > LIMITS.backupBytes || new Blob([text]).size > LIMITS.backupBytes) fail('BACKUP_TOO_LARGE', 413);
    let document;
    try {
      document = JSON.parse(text, (key, value) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) fail('INVALID_BACKUP');
        return value;
      });
    } catch { fail('INVALID_BACKUP'); }
    exactKeys(document, ['format', 'version', 'createdAt', 'board', 'images'], ['locale']);
    if (document.format !== FORMAT || document.version !== 1 || typeof document.createdAt !== 'string' || document.createdAt.length > 40 || !Number.isFinite(Date.parse(document.createdAt))) fail('INVALID_BACKUP');
    if (Object.hasOwn(document, 'locale') && !LOCALES.has(document.locale)) fail('INVALID_BACKUP');
    exactKeys(document.board, ['layout', 'openLinksIn', 'tiles']);
    exactKeys(document.board.layout, ['rows', 'columns']);
    layout(document.board.layout); linkTarget(document.board.openLinksIn);
    if (!Array.isArray(document.board.tiles) || document.board.tiles.length > LIMITS.tiles || !Array.isArray(document.images) || document.images.length > LIMITS.tiles) fail('INVALID_BACKUP');
    const ids = new Set(); const referenced = new Set(); const imageIds = new Set();
    for (const tile of document.board.tiles) {
      exactKeys(tile, ['id', 'url', 'title', 'image']);
      if (typeof tile.id !== 'string' || !UUID.test(tile.id) || ids.has(tile.id) || (tile.image !== null && (typeof tile.image !== 'string' || !UUID.test(tile.image) || referenced.has(tile.image)))) fail('INVALID_BACKUP');
      ids.add(tile.id);
      if (tile.image !== null) referenced.add(tile.image);
      fields(tile);
    }
    for (const image of document.images) {
      exactKeys(image, ['id', 'type', 'data']);
      if (typeof image.id !== 'string' || !UUID.test(image.id) || imageIds.has(image.id) || !TYPES.has(image.type)) fail('INVALID_BACKUP');
      imageIds.add(image.id);
      if (typeof image.data !== 'string' || image.data.length > Math.ceil(LIMITS.imageBytes / 3) * 4) fail('INVALID_BACKUP');
    }
    if (referenced.size !== imageIds.size || [...referenced].some(id => !imageIds.has(id))) fail('INVALID_BACKUP');
    return document;
  }
  async function inspectBackup(source) {
    if (source instanceof Blob && source.size > LIMITS.backupBytes) fail('BACKUP_TOO_LARGE', 413);
    let document;
    try {
      document = parseBackupDocument(source instanceof Blob ? await source.text() : source);
      const images = [];
      let imageBytes = 0;
      for (const image of document.images) {
        const blob = await validateImage(new Blob([base64Bytes(image.data)], { type: image.type }));
        imageBytes += blob.size;
        if (imageBytes > LIMITS.boardImageBytes) fail('BACKUP_TOO_LARGE', 413);
        images.push({ id: image.id, type: blob.type, bytes: await blob.arrayBuffer() });
      }
      const prepared = Object.freeze({ summary: Object.freeze({ tileCount: document.board.tiles.length, imageCount: images.length, imageBytes, ...(document.locale ? { locale: document.locale } : {}) }) });
      preparedBackups.set(prepared, { board: document.board, images });
      return prepared;
    } catch (error) { if (error?.code === 'BACKUP_TOO_LARGE') throw error; fail('INVALID_BACKUP'); }
  }

  async function createStore({ databaseName = 'speedial-local-v1' } = {}) {
    try {
      if (!globalThis.indexedDB || typeof globalThis.crypto?.randomUUID !== 'function') fail('STORAGE_UNAVAILABLE', 503);
    } catch (error) { throw storageError(error); }
    let database;
    try {
      database = await new Promise((resolve, reject) => {
        const opening = indexedDB.open(databaseName, 1);
        let settled = false;
        opening.onupgradeneeded = () => {
          const db = opening.result;
          if (!db.objectStoreNames.contains('boards')) db.createObjectStore('boards');
          if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' });
        };
        opening.onsuccess = () => { if (settled) opening.result.close(); else { settled = true; resolve(opening.result); } };
        opening.onerror = () => { settled = true; reject(opening.error); };
        opening.onblocked = () => { settled = true; reject(new Error('Blocked')); };
      });
    } catch (error) { throw storageError(error); }
    let closed = false;
    const listeners = new Set(); const objectUrls = new Map(); const retiredUrls = new Map();
    let channel;
    const channelName = `speedial:${databaseName}`;
    const notify = (targets = listeners) => { for (const listener of targets) { try { listener(); } catch { /* A view cannot interrupt a committed write. */ } } };
    try { if (typeof BroadcastChannel === 'function') { channel = new BroadcastChannel(channelName); channel.onmessage = () => notify(); } } catch { /* Storage events and focus refresh remain available. */ }
    const storageChanged = event => { if (event.key === channelName) notify(); };
    const foreground = () => { if (!globalThis.document?.hidden) notify(); };
    globalThis.addEventListener?.('storage', storageChanged);
    globalThis.addEventListener?.('focus', foreground);
    globalThis.document?.addEventListener('visibilitychange', foreground);
    function broadcast() {
      notify();
      try { channel?.postMessage({ changed: true }); } catch { /* Focus refresh is still safe. */ }
      // Publish only an invalidation nonce, never a title, URL, ID, or image.
      try { globalThis.localStorage?.setItem(channelName, crypto.randomUUID()); } catch { /* Optional fallback, not the data store. */ }
    }
    function transaction(mode, action) {
      return new Promise((resolve, reject) => {
        if (closed) { reject(storageError()); return; }
        let tx, result, failure;
        try {
          tx = database.transaction(['boards', 'images'], mode);
          tx.oncomplete = () => resolve(result);
          tx.onabort = () => reject(storageError(failure || tx.error));
          tx.onerror = event => { if (event.target?.error) failure ||= event.target.error; };
          const abort = error => { failure = error; try { tx.abort(); } catch { reject(storageError(error)); } };
          action(tx, value => { result = value; }, abort);
        } catch (error) { if (tx) { failure = error; try { tx.abort(); } catch { reject(storageError(error)); } } else reject(storageError(error)); }
      });
    }
    function readRaw() {
      return transaction('readonly', (tx, done, abort) => {
        const board = tx.objectStore('boards').get('current');
        const images = tx.objectStore('images').getAll();
        let completed = 0;
        board.onsuccess = images.onsuccess = () => {
          if (++completed === 2) {
            if (!board.result) { abort(storageError()); return; }
            done({ board: board.result, images: images.result });
          }
        };
      });
    }
    function render({ board, images }) {
      const imageMap = new Map(images.map(image => [image.id, image]));
      const retained = new Set(board.tiles.map(tile => tile.imageId).filter(Boolean));
      const tiles = board.tiles.map(tile => {
        let image = null;
        if (tile.imageId) {
          if (!imageMap.has(tile.imageId)) fail('STORAGE_UNAVAILABLE', 503);
          if (!objectUrls.has(tile.imageId)) {
            const record = imageMap.get(tile.imageId);
            objectUrls.set(tile.imageId, URL.createObjectURL(new Blob([record.bytes], { type: record.type })));
          }
          image = objectUrls.get(tile.imageId);
        }
        return { id: tile.id, title: tile.title, url: tile.url, image };
      });
      for (const [id, url] of objectUrls) if (!retained.has(id)) {
        objectUrls.delete(id);
        // Give the view time to replace its current image/drag preview before
        // reclaiming a removed Blob URL. Unchanged image IDs keep the same URL.
        const timer = setTimeout(() => { URL.revokeObjectURL(url); retiredUrls.delete(url); }, 30000);
        retiredUrls.set(url, timer);
      }
      return { id: board.id, revision: board.revision, layout: { ...board.layout }, openLinksIn: board.openLinksIn, tiles };
    }
    async function read() { return render(await readRaw()); }
    async function write(revision, mutate) {
      await transaction('readwrite', (tx, done, abort) => {
        const boardStore = tx.objectStore('boards'); const images = tx.objectStore('images');
        const loading = boardStore.get('current'); const loadingImages = images.getAll();
        let completed = 0;
        loading.onsuccess = loadingImages.onsuccess = () => {
          // Some engines can mark both requests done before dispatching either
          // success event. Mutate only once, after both events were observed.
          if (++completed !== 2) return;
          try {
            const board = loading.result;
            if (!board) fail('STORAGE_UNAVAILABLE', 503);
            if (!Number.isSafeInteger(revision) || board.revision !== revision) fail('REVISION_CONFLICT', 409);
            if (board.revision >= Number.MAX_SAFE_INTEGER) fail('STORAGE_UNAVAILABLE', 503);
            const imageMap = new Map(loadingImages.result.map(image => [image.id, image]));
            const imageWrites = {
              put(image) { imageMap.set(image.id, image); images.put(image); },
              delete(id) { imageMap.delete(id); images.delete(id); },
              clear() { imageMap.clear(); images.clear(); },
            };
            mutate(board, imageWrites);
            const imageBytes = [...imageMap.values()].reduce((size, image) => size + image.bytes.byteLength, 0);
            if (imageBytes > LIMITS.boardImageBytes) fail('BACKUP_TOO_LARGE', 413);
            board.revision++;
            boardStore.put(board, 'current');
            done();
          } catch (error) { abort(error); }
        };
      });
      broadcast();
      return read();
    }
    try {
      await transaction('readwrite', (tx, done, abort) => {
        const boards = tx.objectStore('boards'); const loading = boards.get('current');
        loading.onsuccess = () => {
          try {
            if (!loading.result) boards.put({ schemaVersion: 1, id: crypto.randomUUID(), revision: 0, tiles: [], layout: { rows: 4, columns: 5 }, openLinksIn: 'same-window' }, 'current');
            done();
          } catch (error) { abort(error); }
        };
      });
    } catch (error) { close(); throw error; }
    async function request(path, { method = 'GET', body = {} } = {}) {
      if (path === '/api/state' && method === 'GET') return read();
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail('INVALID_JSON');
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) fail('METHOD_NOT_ALLOWED', 405);
      if (path.endsWith('/screenshot')) fail('SCREENSHOT_UNAVAILABLE');
      let image;
      let blob;
      if (Object.hasOwn(body, 'image')) blob = await validateImage(body.image);
      else if (/\/image$/.test(path)) blob = await validateImage(body.data);
      // Store exact binary bytes in every engine. In particular, WebKit can
      // reject otherwise valid Blob/File records while preparing an IDB write.
      // Conversion completes before the transaction; there is no fallback.
      if (blob) image = { type: blob.type, bytes: await blob.arrayBuffer() };
      return write(body.revision, (board, images) => {
        function setImage(tile) {
          if (tile.imageId) images.delete(tile.imageId);
          tile.imageId = image ? crypto.randomUUID() : null;
          if (image) images.put({ id: tile.imageId, ...image });
        }
        if (path === '/api/tiles' && method === 'POST') {
          if (board.tiles.length >= LIMITS.tiles) fail('BOOKMARK_LIMIT');
          const tile = { id: crypto.randomUUID(), ...fields(body), imageId: null };
          if (image) setImage(tile);
          board.tiles.push(tile);
        } else if (path === '/api/settings' && method === 'PUT') {
          board.layout = layout(body);
          board.openLinksIn = linkTarget(body.openLinksIn ?? board.openLinksIn);
        } else if (path === '/api/order' && method === 'PUT') {
          const ids = body.ids;
          const byId = new Map(board.tiles.map(tile => [tile.id, tile]));
          if (!Array.isArray(ids) || ids.length !== board.tiles.length || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) fail('INVALID_ORDER');
          board.tiles = ids.map(id => byId.get(id));
        } else {
          const match = /^\/api\/tiles\/([a-zA-Z0-9-]+)(?:\/(image))?$/.exec(path);
          if (!match) fail('NOT_FOUND', 404);
          const tile = board.tiles.find(item => item.id === match[1]);
          if (!tile) fail('BOOKMARK_NOT_FOUND', 404);
          if (!match[2] && method === 'DELETE') {
            if (tile.imageId) images.delete(tile.imageId);
            board.tiles = board.tiles.filter(item => item.id !== tile.id);
          } else if (!match[2] && method === 'PATCH') {
            const updated = fields({ title: body.title ?? tile.title, url: body.url ?? tile.url });
            if (image || updated.url !== tile.url) setImage(tile);
            Object.assign(tile, updated);
          } else if (match[2] === 'image' && method === 'POST') setImage(tile);
          else fail('METHOD_NOT_ALLOWED', 405);
        }
      });
    }
    async function exportBackup({ locale } = {}) {
      if (locale !== undefined && !LOCALES.has(locale)) fail('INVALID_BACKUP');
      const { board, images } = await readRaw();
      const imageMap = new Map(images.map(image => [image.id, image]));
      const exportedImages = [];
      let estimatedBytes = 0;
      for (const id of new Set(board.tiles.map(tile => tile.imageId).filter(Boolean))) {
        const image = imageMap.get(id);
        if (!(image?.bytes instanceof ArrayBuffer) || !TYPES.has(image.type)) fail('STORAGE_UNAVAILABLE', 503);
        estimatedBytes += Math.ceil(image.bytes.byteLength / 3) * 4;
        if (estimatedBytes > LIMITS.backupBytes) fail('BACKUP_TOO_LARGE', 413);
        exportedImages.push({ id, type: image.type, data: bytesBase64(new Uint8Array(image.bytes)) });
      }
      const output = JSON.stringify({ format: FORMAT, version: 1, createdAt: new Date().toISOString(), ...(locale ? { locale } : {}), board: { layout: board.layout, openLinksIn: board.openLinksIn, tiles: board.tiles.map(tile => ({ id: tile.id, title: tile.title, url: tile.url, image: tile.imageId })) }, images: exportedImages });
      if (new Blob([output]).size > LIMITS.backupBytes) fail('BACKUP_TOO_LARGE', 413);
      return output;
    }
    async function importBackup(prepared, { revision, mode = 'replace' } = {}) {
      const data = preparedBackups.get(prepared);
      if (!data || mode !== 'replace') fail('INVALID_BACKUP');
      return write(revision, (board, images) => {
        const idMap = new Map(data.images.map(image => [image.id, crypto.randomUUID()]));
        images.clear();
        for (const image of data.images) images.put({ id: idMap.get(image.id), type: image.type, bytes: image.bytes });
        board.layout = { ...data.board.layout };
        board.openLinksIn = data.board.openLinksIn;
        board.tiles = data.board.tiles.map(tile => ({ id: crypto.randomUUID(), ...fields(tile), imageId: tile.image ? idMap.get(tile.image) : null }));
      });
    }
    function close() {
      if (closed) return;
      closed = true;
      database.close(); channel?.close(); listeners.clear();
      globalThis.removeEventListener?.('storage', storageChanged);
      globalThis.removeEventListener?.('focus', foreground);
      globalThis.document?.removeEventListener('visibilitychange', foreground);
      for (const url of objectUrls.values()) URL.revokeObjectURL(url);
      for (const [url, timer] of retiredUrls) { clearTimeout(timer); URL.revokeObjectURL(url); }
      objectUrls.clear(); retiredUrls.clear();
    }
    const invalidate = () => { const targets = [...listeners]; close(); notify(targets); };
    database.onversionchange = invalidate;
    database.onclose = invalidate;
    return Object.freeze({ read, request, exportBackup, inspectBackup, importBackup, close,
      subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Expected a listener'); listeners.add(listener); return () => listeners.delete(listener); },
      async storageInfo() {
        const storage = globalThis.navigator?.storage;
        let usage = null, quota = null, persisted = null;
        try { const estimate = await storage?.estimate?.(); usage = estimate?.usage ?? null; quota = estimate?.quota ?? null; } catch { /* Estimate is advisory. */ }
        try { persisted = await storage?.persisted?.() ?? null; } catch { /* Some private profiles deny this API. */ }
        return { usage, quota, persisted, persistenceSupported: typeof storage?.persist === 'function' };
      },
      async requestPersistence() { try { return Boolean(await globalThis.navigator?.storage?.persist?.()); } catch { return false; } },
    });
  }
  globalThis.SpeedialStorage = Object.freeze({ createStore, inspectBackup, limits: LIMITS,
    validation: Object.freeze({ fields, layout, linkTarget, base64Bytes, imageDimensions, parseBackupDocument, validateImage }),
  });
})();
