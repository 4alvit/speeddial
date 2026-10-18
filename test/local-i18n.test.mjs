import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({ Intl });
vm.runInContext(fs.readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8'), context);
const original = context.SpeedDialI18n;
vm.runInContext(fs.readFileSync(new URL('../local/i18n.js', import.meta.url), 'utf8'), context);
const local = context.SpeedDialI18n;
const placeholders = value => [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(match => match[1]).sort();

test('local privacy, backup and storage UI are translated in all five languages without changing the private catalogs', () => {
  assert.notEqual(local, original);
  assert.equal(original.catalogs.en.appTitle, 'Speed Dial');
  assert.equal(local.catalogs.en.appTitle, 'Speed Dial');
  const keys = Object.keys(local.catalogs.en).sort();
  for (const [locale, catalog] of Object.entries(local.catalogs)) {
    assert.deepEqual(Object.keys(catalog).sort(), keys, `${locale}: complete local catalog`);
    for (const key of keys) {
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim(), `${locale}.${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(local.catalogs.en[key]), `${locale}.${key}: placeholders`);
    }
    for (const key of ['privacyDetails', 'backupReminder', 'invalidBackup', 'storagePersistent', 'reloadPage'])
      assert.ok(Object.hasOwn(catalog, key), `${locale}: ${key} is translated`);
  }
  const html = fs.readFileSync(new URL('../local/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-aria-label|-title|-placeholder)?="([^"]+)"/g))
    assert.ok(Object.hasOwn(local.catalogs.en, match[1]), `local HTML key ${match[1]} exists`);
});

test('local backup summaries keep untrusted interpolation literal', () => {
  const value = '<img src=x onerror=alert(1)> $&';
  assert.equal(local.translate('en', 'importSummary', { sites: value, images: 2, size: '1 MB' }), `${value} sites · 2 images · 1 MB of image data`);
  assert.equal(local.translate('en', '__proto__'), '__proto__');
  assert.equal(local.translate('en', 'importSummary', Object.create({ sites: 'inherited' })), '{sites} sites · {images} images · {size} of image data');
});
