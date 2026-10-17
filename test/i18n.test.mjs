import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8');
const context = vm.createContext({ Intl });
vm.runInContext(source, context);
const i18n = context.SpeedDialI18n;
const placeholders = text => [...text.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(match => match[1]).sort();

test('all five catalogs contain every English key and preserve interpolation placeholders', () => {
  assert.deepEqual(Object.keys(i18n.languages), ['en', 'ru', 'de', 'fr', 'es']);
  const keys = Object.keys(i18n.catalogs.en).sort();
  assert.ok(keys.length > 80, 'catalog must include dynamic and accessibility messages');
  for (const [locale, catalog] of Object.entries(i18n.catalogs)) {
    assert.deepEqual(Object.keys(catalog).sort(), keys, `${locale} key parity`);
    for (const key of keys) {
      assert.equal(typeof catalog[key], 'string');
      assert.ok(catalog[key].trim(), `${locale}.${key} is not empty`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(i18n.catalogs.en[key]), `${locale}.${key} placeholders`);
    }
  }
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-aria-label|-title|-placeholder)?="([^"]+)"/g))
    assert.ok(Object.hasOwn(i18n.catalogs.en, match[1]), `HTML key ${match[1]} exists`);
});

test('locale selection defaults safely to English and persists only valid supported values', () => {
  for (const value of [undefined, null, '', 'pt', 'ru-RU', 'EN', '{}', '__proto__', 'constructor', 42]) {
    assert.equal(i18n.normalizeLocale(value), 'en');
    assert.equal(i18n.readLocale({ getItem: () => value }), 'en');
    assert.equal(i18n.translate(value, 'settings'), 'Settings');
  }
  for (const locale of Object.keys(i18n.languages)) {
    const values = new Map();
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    assert.equal(i18n.saveLocale(storage, locale), true);
    assert.equal(values.get('speeddial.language'), locale);
    assert.equal(i18n.readLocale(storage), locale);
  }
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(i18n.readLocale(blocked), 'en');
  assert.equal(i18n.readLocale(undefined), 'en');
  assert.equal(i18n.saveLocale(blocked, 'ru'), false);
});

test('interpolation preserves untrusted names as literal text and ignores inherited properties', () => {
  const name = '<img src=x onerror=alert(1)> {total} $&';
  assert.equal(i18n.translate('en', 'editNamed', { name }), `Edit ${name}`);
  assert.equal(i18n.translate('en', 'editNamed', Object.create({ name: 'inherited' })), 'Edit {name}');
  assert.equal(i18n.translate('en', '__proto__'), '__proto__');
  assert.equal(i18n.translate('en', 'missing-key'), 'missing-key');
  assert.equal(i18n.translate('ru', 'pageStatus', { page: 1, total: 4 }), 'Страница 1 из 4');
  assert.equal(i18n.formatNumber('de', 12345), '12.345');
});

test('DOM translation writes text and safe attributes without interpreting HTML', () => {
  const nodes = [
    { attrs: { 'data-i18n': 'settings' }, textContent: '' },
    { attrs: { 'data-i18n-aria-label': 'showControls' } },
    { attrs: { 'data-i18n-placeholder': 'namePlaceholder' } },
  ];
  for (const node of nodes) {
    node.getAttribute = name => node.attrs[name];
    node.setAttribute = (name, value) => { node.attrs[name] = value; };
    Object.defineProperty(node, 'innerHTML', { set() { throw new Error('HTML injection'); } });
  }
  const root = { querySelectorAll: selector => nodes.filter(node => Object.hasOwn(node.attrs, selector.slice(1, -1))) };
  i18n.apply(root, 'fr');
  assert.equal(nodes[0].textContent, 'Paramètres');
  assert.equal(nodes[1].attrs['aria-label'], 'Afficher les commandes');
  assert.equal(nodes[2].attrs.placeholder, 'Par exemple, Courrier');
});
