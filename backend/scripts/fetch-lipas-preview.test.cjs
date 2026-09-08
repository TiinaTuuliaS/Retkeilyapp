const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { fetchPreview } = require('./fetch-lipas-preview.cjs');

const fixture = id => ({
  'lipas-id': id, type: { 'type-code': 301 }, status: 'active', name: `Site ${id}`,
  'event-date': '2020-09-16T09:41:19Z',
  location: { geometries: { features: [{ geometry: { type: 'Point', coordinates: [24.5, 60.3] } }] } },
});
const reply = site => ({ ok: true, json: async () => site });

test('a failed second response preserves the complete previous preview', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'retki-fetch-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'nuuksio-laavut.geojson');
  await fs.writeFile(target, 'previous preview');
  await assert.rejects(fetchPreview(dir, async url => url.endsWith('73487')
    ? reply(fixture(73487)) : { ok: false, status: 503 }), /503/);
  assert.equal(await fs.readFile(target, 'utf8'), 'previous preview');
});

test('inactive data cannot replace the current preview', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'retki-fetch-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await assert.rejects(fetchPreview(dir, async () => reply({ ...fixture(73487), status: 'out-of-service-permanently' })), /no longer active/);
  await assert.rejects(fs.access(path.join(dir, 'nuuksio-laavut.geojson')));
});

test('repeat fetch distinguishes actual source changes from retrieval time', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'retki-fetch-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const fetcher = async url => reply(fixture(Number(url.split('/').pop())));
  await fetchPreview(dir, fetcher);
  const repeated = await fetchPreview(dir, fetcher);
  assert.ok(repeated.changes.every(change => change.changedFields === '(no source changes)'));
  const changed = await fetchPreview(dir, async url => {
    const site = fixture(Number(url.split('/').pop()));
    if (site['lipas-id'] === 73487) site.name = 'Changed name';
    return reply(site);
  });
  assert.equal(changed.changes[0].changedFields, 'name');
  const saved = JSON.parse(await fs.readFile(path.join(dir, 'nuuksio-laavut.geojson'), 'utf8'));
  assert.equal(saved.features.length, 2);
  assert.equal(saved.features[0].properties.source_event_date, fixture(73487)['event-date']);
});
