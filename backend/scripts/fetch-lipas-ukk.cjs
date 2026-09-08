const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

async function main() {
  const dir = path.resolve(__dirname, '../../data-preview/lipas-ukk');
  const reviewed = JSON.parse(await fs.readFile(path.join(dir, 'sites.geojson'), 'utf8')).features
    .filter(f => f.properties.park_classification === 'inside');
  assert.equal(reviewed.length, 33);
  assert.equal(new Set(reviewed.map(f => f.properties.source_id)).size, 33);
  const fetchedAt = new Date().toISOString();
  const features = [], raw = [];
  for (const original of reviewed) {
    const id = original.properties.source_id;
    const url = `https://api.lipas.fi/v2/sports-sites/${id}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    assert.ok(response.ok, `${id}: HTTP ${response.status}`);
    const site = await response.json();
    assert.equal(site['lipas-id'], id);
    assert.equal(site.status, 'active', `${id}: status changed; review required`);
    const code = site.type?.['type-code'];
    assert.equal(code, original.properties.type_code);
    assert.ok([301,206].includes(code));
    assert.ok(typeof site.name === 'string' && site.name.trim());
    assert.ok(Number.isFinite(Date.parse(site['event-date'])));
    const geometries = site.location?.geometries?.features;
    assert.equal(geometries?.length, 1);
    assert.deepEqual(geometries[0].geometry, original.geometry, `${id}: geometry changed; recheck park membership`);
    for (const key of ['toilet?', 'free-use?']) {
      assert.ok(site.properties?.[key] === undefined || typeof site.properties[key] === 'boolean');
    }
    const p = site.properties || {};
    features.push({ type: 'Feature', id: `lipas:sports-sites:${id}`, geometry: original.geometry,
      properties: { name: site.name, type: code === 301 ? 'shelter' : 'fireplace',
        source: 'lipas', source_collection: 'sports-sites', source_id: String(id),
        source_type_code: code, source_status: site.status, source_url: url,
        source_event_date: site['event-date'], fetched_at: fetchedAt,
        toilet: p['toilet?'] ?? null, free_use: p['free-use?'] ?? null,
        water_point: ['year-round','seasonal'].includes(p['water-point']) ? p['water-point'] : null,
        source_owner: site.owner ?? null, source_admin: site.admin ?? null,
      } });
    raw.push(site);
    console.log(`${features.length}/33: ${site.name}`);
  }
  const snapshot = path.join(dir, 'fetches', fetchedAt.replace(/[:.]/g, '-'));
  await fs.mkdir(snapshot, { recursive: true });
  await fs.writeFile(path.join(snapshot, 'responses.json'), JSON.stringify({ fetchedAt, sites: raw }, null, 2));
  const temporary = path.join(dir, '.import.tmp');
  await fs.writeFile(temporary, JSON.stringify({ type: 'FeatureCollection', features }, null, 2));
  await fs.rename(temporary, path.join(dir, 'import.geojson'));
  console.log('All 33 validated; import.geojson ready. Database unchanged.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
