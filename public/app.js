'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  // Keep the authorized entry URL without embedding a credential in assets.
  $('home-link').setAttribute('href', window.location.pathname + window.location.search);
  const i18n = globalThis.SpeedDialI18n;
  let locale;
  try { locale = i18n.readLocale(window.localStorage); } catch { locale = 'en'; }
  const t = (key, values) => i18n.translate(locale, key, values);
  const number = value => i18n.formatNumber(locale, value);
  const localError = (key, values) => Object.assign(new Error(t(key, values)), { i18nKey: key, i18nValues: values });
  const errorText = error => error.i18nKey ? t(error.i18nKey, error.i18nValues) : t('connectionHint');
  const serverErrorKeys = {
    INVALID_URL: 'invalidUrl', INVALID_TITLE: 'invalidTitle', TITLE_TOO_LONG: 'titleTooLong',
    REVISION_CONFLICT: 'conflict', IMAGE_REQUIRED: 'imageRequired', IMAGE_TYPE_UNSUPPORTED: 'imageType',
    IMAGE_TOO_LARGE: 'imageTooLarge', INVALID_IMAGE: 'invalidImage', INVALID_IMAGE_SIZE: 'invalidImageSize',
    INVALID_JSON: 'invalidRequest', JSON_REQUIRED: 'invalidRequest', NOT_FOUND: 'notFound', BOOKMARK_NOT_FOUND: 'notFound',
    METHOD_NOT_ALLOWED: 'invalidRequest', ORIGIN_NOT_ALLOWED: 'forbidden', BOOKMARK_LIMIT: 'bookmarkLimit',
    INVALID_LAYOUT: 'invalidDimensions', INVALID_LINK_TARGET: 'invalidLinkTarget', INVALID_ORDER: 'invalidOrder',
    UNAUTHORIZED: 'sessionExpired', SERVER_ERROR: 'serverError',
  };
  const state = { revision: null, tiles: [], layout: { rows: 4, columns: 5 }, openLinksIn: 'same-window' };
  let loaded = false;
  let currentPage = 0;
  let editingId = null;
  let settingsAtOpen = null;
  let editorAtOpen = null;
  let deleteRevision = null;
  let mutationBusy = false;
  let drag = null;
  let suppressedClick = null;
  let toastTimer;
  let pollTimer;
  let loadingPromise = null;
  let mutationVersion = 0;
  const pendingStatuses = new Set(['pending', 'queued', 'capturing', 'running', 'processing']);

  function icon(name, className = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `icon ${className}`.trim());
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function hostname(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  }

  function title(tile) { return tile.title || hostname(tile.url) || t('untitled'); }
  function currentTile() { return state.tiles.find((tile) => tile.id === editingId); }
  function isPending(tile) { return pendingStatuses.has(tile.screenshotStatus); }
  function isError(tile) { return ['error', 'failed', 'blocked'].includes(tile.screenshotStatus); }
  function validDimension(value) { return Number.isInteger(value) && value >= 1 && value <= 12; }
  function pageCapacity() { return state.layout.rows * state.layout.columns; }
  function pageCount() { return Math.max(1, Math.ceil(state.tiles.length / pageCapacity())); }

  function notify(message, error = false) {
    clearTimeout(toastTimer);
    $('toast-message').textContent = message;
    $('toast').classList.toggle('is-error', error);
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, error ? 12000 : 5000);
  }

  function formError(id, message = '') {
    $(id).textContent = message;
    $(id).hidden = !message;
  }

  async function request(path, { method = 'GET', body, signal } = {}) {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    let data;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok) {
      const error = localError((Object.hasOwn(serverErrorKeys, data?.code) ? serverErrorKeys[data.code] : null) || (response.status === 401 ? 'sessionExpired' : 'serverError'), { status: number(response.status) });
      error.status = response.status;
      if (response.status === 409) {
        await loadState({ force: true }).catch(() => {});
        error.i18nKey = 'conflict';
        error.message = t('conflict');
      }
      throw error;
    }
    if (!data || !Array.isArray(data.tiles)) throw localError('unexpectedResponse');
    return data;
  }

  function applyState(data, { force = false } = {}) {
    // A delayed poll must never roll the board back after a successful write.
    if (Number.isInteger(state.revision) && Number.isInteger(data.revision) && data.revision < state.revision) return;
    const layout = {
      rows: validDimension(data.layout?.rows) ? data.layout.rows : 4,
      columns: validDimension(data.layout?.columns) ? data.layout.columns : 5,
    };
    const layoutChanged = layout.rows !== state.layout.rows || layout.columns !== state.layout.columns;
    const openLinksIn = data.openLinksIn === 'new-window' ? 'new-window' : 'same-window';
    const changed = layoutChanged || openLinksIn !== state.openLinksIn || state.revision !== data.revision || JSON.stringify(state.tiles) !== JSON.stringify(data.tiles);
    state.revision = data.revision;
    state.tiles = data.tiles;
    state.layout = layout;
    state.openLinksIn = openLinksIn;
    if (layoutChanged) currentPage = 0;
    loaded = true;
    $('loading').hidden = true;
    $('load-error').hidden = true;
    if ((changed || force) && !drag) render();
    if ($('editor-dialog').open && editingId) updatePreview();
    schedulePoll();
  }

  async function loadState({ force = false } = {}) {
    if (loadingPromise) {
      try { await loadingPromise; } catch (error) { if (!force) throw error; }
      // A conflict refresh must not reuse a poll started before the edit.
      if (force) return loadState({ force });
      return;
    }
    const versionAtRequest = mutationVersion;
    loadingPromise = (async () => {
      const data = await request('/api/state');
      if ((!drag || force) && versionAtRequest === mutationVersion) applyState(data, { force });
      setConnection(true);
    })();
    try { await loadingPromise; }
    catch (error) {
      setConnection(false);
      if (!loaded) {
        $('loading').hidden = true;
        $('load-error').hidden = false;
        $('load-error-message').textContent = errorText(error);
      }
      throw error;
    } finally { loadingPromise = null; }
  }

  function setConnection(online) {
    const node = $('connection-status');
    node.hidden = online;
  }

  function schedulePoll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => {
      if (!drag && !mutationBusy && !document.hidden) await loadState().catch(() => {});
      schedulePoll();
    }, state.tiles.some(isPending) ? 2500 : 15000);
  }

  async function mutate(path, method, body = {}, { revision = state.revision } = {}) {
    if (mutationBusy) throw localError('busy');
    mutationBusy = true;
    mutationVersion += 1;
    try {
      const data = await request(path, { method, body: { ...body, revision } });
      applyState(data, { force: true });
      setConnection(true);
      return data;
    } catch (error) {
      if (!error.status) setConnection(false);
      throw error;
    } finally { mutationBusy = false; }
  }

  function placeholder(tile) {
    const node = element('span', 'tile-placeholder');
    node.append(element('span', 'tile-initial', Array.from(title(tile))[0]?.toLocaleUpperCase(locale)));
    return node;
  }

  function imageInto(container, tile) {
    if (!tile.image) { container.append(placeholder(tile)); return; }
    const img = element('img');
    img.src = tile.image;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('error', () => img.replaceWith(placeholder(tile)), { once: true });
    container.append(img);
  }

  function toolButton(name, label, handler) {
    const button = element('button', 'icon-button');
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.append(icon(name));
    if (handler) button.addEventListener('click', handler);
    return button;
  }

  function createTile(tile) {
    const card = element('article', 'tile');
    card.dataset.id = tile.id;
    card.setAttribute('role', 'listitem');
    const link = element('a', 'tile-link');
    link.href = tile.url;
    const newWindow = state.openLinksIn === 'new-window';
    link.target = newWindow ? '_blank' : '_self';
    link.rel = 'noopener noreferrer';
    link.title = `${title(tile)}\n${tile.url}`;
    link.setAttribute('aria-label', t(newWindow ? 'openNew' : 'openSame', { name: title(tile) }));
    link.draggable = false;
    link.addEventListener('pointerdown', (event) => {
      // Touch scrolling stays native in both axes; use the grip to drag.
      if (event.pointerType !== 'touch') beginDrag(event, tile.id, true);
    });
    const visual = element('div', 'tile-image');
    imageInto(visual, tile);
    if (isPending(tile) || isError(tile)) {
      const badge = element('span', `tile-badge${isError(tile) ? ' is-error' : ''}`);
      if (isPending(tile)) badge.append(element('span', 'spinner'));
      badge.append(document.createTextNode(t(isPending(tile) ? 'capturing' : 'screenshotUnavailable')));
      if (isError(tile)) badge.title = t('screenshotFailed');
      visual.append(badge);
    }
    link.append(visual);
    card.append(link);
    const tools = element('div', 'tile-tools');
    const handle = toolButton('drag', t('moveSite', { name: title(tile) }));
    handle.classList.add('drag-handle');
    handle.addEventListener('pointerdown', (event) => beginDrag(event, tile.id));
    handle.addEventListener('keydown', (event) => keyboardMove(event, tile.id));
    tools.append(handle, toolButton('edit', t('editNamed', { name: title(tile) }), () => openEditor(tile.id)));
    card.append(tools);
    return card;
  }

  function render() {
    if (!loaded) return;
    currentPage = Math.max(0, Math.min(currentPage, pageCount() - 1));
    const first = currentPage * pageCapacity();
    const tiles = state.tiles.slice(first, first + pageCapacity());
    const fragment = document.createDocumentFragment();
    tiles.forEach((tile) => fragment.append(createTile(tile)));
    $('grid').style.setProperty('--columns', String(state.layout.columns));
    $('grid').replaceChildren(fragment);
    $('grid').hidden = !tiles.length;
    $('empty-state').hidden = Boolean(tiles.length);
    $('pagination').hidden = pageCount() === 1;
    $('page-status').textContent = t('pageStatus', { page: number(currentPage + 1), total: number(pageCount()) });
    $('previous-page').disabled = currentPage === 0;
    $('next-page').disabled = currentPage === pageCount() - 1;
  }

  function changePage(page) {
    if (drag || mutationBusy) return;
    currentPage = Math.max(0, Math.min(page, pageCount() - 1));
    render();
    $('grid-viewport').scrollLeft = 0;
  }

  function showTilePage(id) {
    const index = state.tiles.findIndex((tile) => tile.id === id);
    if (index === -1) return;
    currentPage = Math.floor(index / pageCapacity());
    render();
  }

  function updateLayoutCapacity() {
    const rows = $('layout-rows').valueAsNumber;
    const columns = $('layout-columns').valueAsNumber;
    $('layout-capacity').textContent = validDimension(rows) && validDimension(columns)
      ? t('capacity', { count: number(rows * columns) })
      : t('invalidDimensions');
  }

  function openEditor(id = null) {
    editingId = id;
    const tile = currentTile();
    if (id && !tile) return;
    editorAtOpen = tile ? { revision: state.revision, title: tile.title || '', url: tile.url } : null;
    formError('editor-error');
    $('editor-form').reset();
    $('tile-url').value = tile?.url || '';
    $('tile-title').value = tile?.title || '';
    $('editor-title').textContent = t(tile ? 'editSite' : 'addSite');
    $('save-tile').textContent = t(tile ? 'save' : 'addSite');
    $('preview-settings').hidden = !tile;
    $('delete-tile').hidden = !tile;
    $('new-preview-note').hidden = Boolean(tile);
    if (tile) updatePreview();
    $('editor-dialog').showModal();
    $('tile-url').focus();
  }

  function updatePreview() {
    const tile = currentTile();
    if (!tile) {
      if ($('editor-dialog').open && !mutationBusy) {
        $('editor-dialog').close();
        $('delete-dialog').close();
        notify(t('deletedElsewhere'));
      }
      return;
    }
    const preview = $('editor-preview');
    const previewKey = JSON.stringify([tile.id, tile.image, tile.title, tile.url]);
    if (preview.dataset.key !== previewKey || !preview.childNodes.length) {
      preview.replaceChildren();
      imageInto(preview, tile);
      preview.dataset.key = previewKey;
    }
    $('capture-tile').disabled = isPending(tile);
    $('preview-status').textContent = isPending(tile)
      ? t('capturePending')
      : isError(tile)
        ? t('screenshotFailed')
        : t('captureHint');
  }

  function normalizeUrl(value) {
    const raw = value.trim();
    if (!raw || raw.length > 4096) throw localError('invalidUrl');
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) && !/^[^/:]+:\d+(?:\/|$)/.test(raw) ? raw : `https://${raw}`;
    let url;
    try { url = new URL(candidate); } catch { throw localError('invalidUrl'); }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw localError('invalidProtocol');
    if (url.username || url.password) throw localError('urlCredentials');
    return url.href;
  }

  async function withFormBusy(form, operation) {
    const controls = [...form.querySelectorAll('button, input, select')];
    const previous = controls.map((node) => node.disabled);
    controls.forEach((node) => { node.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    try { await operation(); }
    finally {
      controls.forEach((node, index) => { node.disabled = previous[index]; });
      form.removeAttribute('aria-busy');
      if (form.id === 'editor-form' && editingId) updatePreview();
    }
  }

  function focusHandle(id) {
    const card = [...$('grid').querySelectorAll('.tile')].find((node) => node.dataset.id === id);
    card?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    card?.querySelector('.drag-handle')?.focus({ preventScroll: true });
  }

  async function saveOrder(ids, movedId) {
    try {
      await mutate('/api/order', 'PUT', { ids });
      showTilePage(movedId);
      focusHandle(movedId);
      $('announcer').textContent = t('swapped', { position: number(ids.indexOf(movedId) + 1), total: number(ids.length) });
    } catch (error) { render(); notify(errorText(error), true); }
  }

  function beginDrag(event, id, fromLink = false) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || mutationBusy || drag) return;
    if (!fromLink) {
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
    }
    suppressedClick = null;
    const card = event.currentTarget.closest('.tile');
    const rect = card.getBoundingClientRect();
    drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false,
      card, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      width: rect.width, height: rect.height, preview: null,
      ids: state.tiles.map((tile) => tile.id) };
    document.addEventListener('pointermove', moveDrag, { passive: false });
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', cancelDrag);
  }

  function swapTarget(event) {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.tile');
    return target && $('grid').contains(target) && target.dataset.id !== drag.id ? target : null;
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    event.preventDefault();
    drag.moved = true;
    document.body.classList.add('is-dragging');
    drag.card.classList.add('dragging');
    if (!drag.preview) {
      drag.preview = drag.card.querySelector('.tile-image').cloneNode(true);
      drag.preview.classList.add('drag-preview');
      drag.preview.setAttribute('aria-hidden', 'true');
      drag.preview.inert = true;
      drag.preview.style.width = `${drag.width}px`;
      drag.preview.style.height = `${drag.height}px`;
      document.body.append(drag.preview);
    }
    drag.preview.style.transform = `translate3d(${event.clientX - drag.offsetX}px, ${event.clientY - drag.offsetY}px, 0)`;
    // Keep every slot fixed while dragging. Only the two drop endpoints swap.
    document.querySelector('.tile.swap-target')?.classList.remove('swap-target');
    swapTarget(event)?.classList.add('swap-target');
    const viewport = $('grid-viewport');
    const bounds = viewport.getBoundingClientRect();
    if (viewport.scrollWidth > viewport.clientWidth && event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
      if (event.clientX >= bounds.left && event.clientX < bounds.left + 28) viewport.scrollLeft -= 12;
      else if (event.clientX <= bounds.right && event.clientX > bounds.right - 28) viewport.scrollLeft += 12;
    }
    if (event.clientY < 80) window.scrollBy(0, -12);
    else if (event.clientY > window.innerHeight - 80) window.scrollBy(0, 12);
  }

  function clearDrag() {
    document.removeEventListener('pointermove', moveDrag);
    document.removeEventListener('pointerup', finishDrag);
    document.removeEventListener('pointercancel', cancelDrag);
    document.body.classList.remove('is-dragging');
    document.querySelector('.tile.dragging')?.classList.remove('dragging');
    document.querySelector('.tile.swap-target')?.classList.remove('swap-target');
    drag.preview?.remove();
    drag = null;
  }

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { id, ids, moved, pointerId } = drag;
    const targetId = moved ? swapTarget(event)?.dataset.id : null;
    if (moved) suppressedClick = { pointerId, until: performance.now() + 400 };
    clearDrag();
    const from = ids.indexOf(id), to = ids.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      [ids[from], ids[to]] = [ids[to], ids[from]];
      saveOrder(ids, id);
    }
  }

  function cancelDrag() {
    if (!drag) return;
    const { id, moved, pointerId } = drag;
    if (moved) suppressedClick = { pointerId, until: performance.now() + 400 };
    clearDrag();
    render();
    focusHandle(id);
    if (moved) $('announcer').textContent = t('dragCancelled');
  }

  function keyboardMove(event, id) {
    if (mutationBusy || drag) return;
    const ids = state.tiles.map((tile) => tile.id);
    const from = ids.indexOf(id);
    const columns = state.layout.columns;
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns, Home: -from, End: ids.length - 1 - from };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const to = Math.max(0, Math.min(ids.length - 1, from + offsets[event.key]));
    if (to === from) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    saveOrder(ids, id);
  }

  function refreshSettingsBaseline() {
    for (const [key, id, value] of [['rows', 'layout-rows', state.layout.rows], ['columns', 'layout-columns', state.layout.columns], ['openLinksIn', 'open-links-in', state.openLinksIn]]) {
      if ($(id).value === String(settingsAtOpen[key])) $(id).value = value;
    }
    settingsAtOpen = { ...state.layout, openLinksIn: state.openLinksIn, revision: state.revision };
    updateLayoutCapacity();
  }

  function refreshEditorBaseline() {
    const tile = currentTile();
    if (!tile || !editorAtOpen) return;
    if ($('tile-title').value === editorAtOpen.title) $('tile-title').value = tile.title || '';
    if ($('tile-url').value === editorAtOpen.url) $('tile-url').value = tile.url;
    editorAtOpen = { revision: state.revision, title: tile.title || '', url: tile.url };
  }

  function updateHeaderLabel() {
    const key = $('header-panel').hidden ? 'showControls' : 'hideControls';
    $('header-toggle').setAttribute('aria-label', t(key));
    $('header-toggle').title = t(key);
  }

  function applyLanguage() {
    document.documentElement.lang = locale;
    i18n.apply(document, locale);
    updateHeaderLabel();
    updateLayoutCapacity();
    if ($('editor-dialog').open) {
      $('editor-title').textContent = t(editingId ? 'editSite' : 'addSite');
      $('save-tile').textContent = t(editingId ? 'save' : 'addSite');
      if (editingId) updatePreview();
    }
    if ($('delete-dialog').open && currentTile()) $('delete-description').textContent = t('deleteDescription', { name: title(currentTile()) });
    render();
  }

  $('header-toggle').addEventListener('click', () => {
    const expanded = $('header-panel').hidden;
    $('header-panel').hidden = !expanded;
    $('header-toggle').setAttribute('aria-expanded', String(expanded));
    updateHeaderLabel();
  });
  $('previous-page').addEventListener('click', () => changePage(currentPage - 1));
  $('next-page').addEventListener('click', () => changePage(currentPage + 1));
  $('open-settings').addEventListener('click', () => {
    settingsAtOpen = { ...state.layout, openLinksIn: state.openLinksIn, revision: state.revision };
    $('layout-rows').value = state.layout.rows;
    $('layout-columns').value = state.layout.columns;
    $('open-links-in').value = state.openLinksIn;
    $('language').value = locale;
    formError('settings-error');
    updateLayoutCapacity();
    $('settings-dialog').showModal();
    $('layout-rows').focus();
  });
  $('layout-rows').addEventListener('input', updateLayoutCapacity);
  $('layout-columns').addEventListener('input', updateLayoutCapacity);
  $('settings-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const rows = $('layout-rows').valueAsNumber;
    const columns = $('layout-columns').valueAsNumber;
    const openLinksIn = $('open-links-in').value;
    formError('settings-error');
    if (!validDimension(rows) || !validDimension(columns)) {
      formError('settings-error', t('invalidDimensions'));
      $(validDimension(rows) ? 'layout-columns' : 'layout-rows').focus();
      return;
    }
    await withFormBusy(event.currentTarget, async () => {
      try {
        // Language is local to this browser; changing it must not write the
        // shared board or contend with another user's edit revision.
        // Preserve fields the user did not change, even if polling updated the
        // shared board while this dialog was open in another browser.
        const shared = {
          rows: rows === settingsAtOpen.rows ? state.layout.rows : rows,
          columns: columns === settingsAtOpen.columns ? state.layout.columns : columns,
          openLinksIn: openLinksIn === settingsAtOpen.openLinksIn ? state.openLinksIn : openLinksIn,
        };
        if (shared.rows !== state.layout.rows || shared.columns !== state.layout.columns || shared.openLinksIn !== state.openLinksIn)
          await mutate('/api/settings', 'PUT', shared, { revision: settingsAtOpen.revision });
        const nextLocale = i18n.normalizeLocale($('language').value);
        let persisted = true;
        if (nextLocale !== locale) {
          locale = nextLocale;
          try { persisted = i18n.saveLocale(window.localStorage, locale); } catch { persisted = false; }
          applyLanguage();
        }
        currentPage = 0;
        render();
        $('grid-viewport').scrollLeft = 0;
        $('settings-dialog').close();
        notify(t(persisted ? 'settingsSaved' : 'storageUnavailable'), !persisted);
      } catch (error) { if (error.status === 409) refreshSettingsBaseline(); formError('settings-error', error.status === 409 ? t('formConflict') : errorText(error)); }
    });
  });
  $('grid').addEventListener('click', (event) => {
    // Prevent the click generated by releasing a dragged link, while keeping
    // normal clicks, modified clicks, and keyboard activation unchanged.
    if (!suppressedClick || performance.now() > suppressedClick.until || event.detail === 0) return;
    if (event.pointerId !== undefined && event.pointerId !== suppressedClick.pointerId) return;
    suppressedClick = null;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  $('add-tile').addEventListener('click', () => openEditor());
  $('empty-add').addEventListener('click', () => openEditor());
  $('retry-load').addEventListener('click', () => {
    $('load-error').hidden = true;
    $('loading').hidden = false;
    loadState({ force: true }).catch(() => {});
  });
  $('toast-close').addEventListener('click', () => { $('toast').hidden = true; });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => $(button.dataset.close).close()));
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('cancel', (event) => { if (dialog.querySelector('[aria-busy="true"]')) event.preventDefault(); });
  });
  $('editor-dialog').addEventListener('close', () => { editingId = null; editorAtOpen = null; $('image-file').value = ''; });

  $('editor-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    formError('editor-error');
    let url;
    try { url = normalizeUrl($('tile-url').value); }
    catch (error) { formError('editor-error', errorText(error)); $('tile-url').focus(); return; }
    const name = $('tile-title').value.trim();
    if (name.length > 300) { formError('editor-error', t('titleTooLong')); $('tile-title').focus(); return; }
    const data = { title: name, url };
    const id = editingId;
    const existingIds = new Set(state.tiles.map((tile) => tile.id));
    await withFormBusy(event.currentTarget, async () => {
      try {
        await mutate(id ? `/api/tiles/${encodeURIComponent(id)}` : '/api/tiles', id ? 'PATCH' : 'POST', data, { revision: editorAtOpen?.revision ?? state.revision });
        if (!id) {
          const added = state.tiles.find((tile) => !existingIds.has(tile.id));
          if (added) showTilePage(added.id);
        }
        $('editor-dialog').close();
        notify(t(id ? 'changesSaved' : 'siteAdded'));
      } catch (error) { if (error.status === 409) refreshEditorBaseline(); formError('editor-error', error.status === 409 ? t('formConflict') : errorText(error)); }
    });
  });

  $('capture-tile').addEventListener('click', async () => {
    if (!editingId) return;
    formError('editor-error');
    await withFormBusy($('editor-form'), async () => {
      try {
        await mutate(`/api/tiles/${encodeURIComponent(editingId)}/screenshot`, 'POST', {}, { revision: editorAtOpen?.revision ?? state.revision });
        refreshEditorBaseline();
        notify(t('captureStarted'));
      } catch (error) { if (error.status === 409) refreshEditorBaseline(); formError('editor-error', error.status === 409 ? t('formConflict') : errorText(error)); }
    });
  });

  $('upload-tile').addEventListener('click', () => $('image-file').click());
  $('image-file').addEventListener('change', async () => {
    const file = $('image-file').files?.[0];
    if (!file || !editingId) return;
    formError('editor-error');
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { formError('editor-error', t('imageType')); $('image-file').value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { formError('editor-error', t('imageTooLarge')); $('image-file').value = ''; return; }
    await withFormBusy($('editor-form'), async () => {
      try {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(localError('imageReadFailed'));
          reader.readAsDataURL(file);
        });
        await mutate(`/api/tiles/${encodeURIComponent(editingId)}/image`, 'POST', { data }, { revision: editorAtOpen?.revision ?? state.revision });
        refreshEditorBaseline();
        notify(t('imageSaved'));
      } catch (error) { if (error.status === 409) refreshEditorBaseline(); formError('editor-error', error.status === 409 ? t('formConflict') : errorText(error)); }
    });
    $('image-file').value = '';
  });

  $('delete-tile').addEventListener('click', () => {
    const tile = currentTile();
    if (!tile) return;
    formError('delete-error');
    deleteRevision = state.revision;
    $('delete-description').textContent = t('deleteDescription', { name: title(tile) });
    $('delete-dialog').showModal();
    $('delete-dialog').querySelector('[data-close]').focus();
  });
  $('delete-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!editingId) return;
    formError('delete-error');
    await withFormBusy(event.currentTarget, async () => {
      try {
        await mutate(`/api/tiles/${encodeURIComponent(editingId)}`, 'DELETE', {}, { revision: deleteRevision });
        $('delete-dialog').close();
        $('editor-dialog').close();
        notify(t('siteDeleted'));
      } catch (error) { if (error.status === 409) deleteRevision = state.revision; formError('delete-error', errorText(error)); }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drag) { event.preventDefault(); cancelDrag(); return; }
  });
  window.addEventListener('blur', cancelDrag);
  window.addEventListener('online', () => loadState().catch(() => {}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !drag && !mutationBusy) loadState().catch(() => {}); });
  applyLanguage();
  loadState().catch(() => {});
  schedulePoll();
})();
