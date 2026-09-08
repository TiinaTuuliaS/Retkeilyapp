const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

const ids = [73487, 73851];

function convert(site, id, fetchedAt) {
  assert.equal(site['lipas-id'], id, 'Unexpected LIPAS ID');
  assert.equal(site.type?.['type-code'], 301, 'Unexpected site type');
  assert.equal(site.status, 'active', 'Site is no longer active; review before importing');
  assert.ok(typeof site.name === 'string' && site.name.trim(), 'Missing name');
  assert.ok(typeof site['event-date'] === 'string' && Number.isFinite(Date.parse(site['event-date'])), 'Invalid source date');
  const features = site.location?.geometries?.features;
  assert.ok(Array.isArray(features) && features.length === 1, 'Expected one geometry');
  assert.equal(features[0].geometry?.type, 'Point');
  const coordinates = features[0].geometry.coordinates;
  assert.ok(Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite));
  assert.ok(coordinates[0] >= 24.4 && coordinates[0] <= 24.7 && coordinates[1] >= 60.24 && coordinates[1] <= 60.4,
    'Coordinates outside the pilot area; review required');
  for (const key of ['free-use?', 'toilet?']) {
    assert.ok(site.properties?.[key] === undefined || typeof site.properties[key] === 'boolean', `Invalid ${key}`);
  }
  return {
    type: 'Feature', id: `lipas:sports-sites:${id}`,
    geometry: { type: 'Point', coordinates },
    properties: {
      name: site.name, type: 'lean_to', source: 'lipas', source_collection: 'sports-sites', source_id: String(id),
      source_type_code: 301, source_type_name: 'Laavu, kota tai kammi', source_status: site.status,
      source_event_date: site['event-date'], fetched_at: fetchedAt,
      source_url: `https://api.lipas.fi/v2/sports-sites/${id}`,
      free_use: site.properties?.['free-use?'] ?? null, toilet: site.properties?.['toilet?'] ?? null,
      water_point: ['year-round', 'seasonal'].includes(site.properties?.['water-point']) ? site.properties['water-point'] : null,
      source_owner: site.owner ?? null, source_admin: site.admin ?? null,
      address: site.location.address ?? null, municipality_code: site.location.city?.['city-code'] ?? null,
    },
  };
}

async function fetchPreview(directory, fetcher = fetch) {
  const fetchedAt = new Date().toISOString();
  const raw = [];
  const features = [];
  for (const id of ids) {
    const response = await fetcher(`https://api.lipas.fi/v2/sports-sites/${id}`, {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000),
    });
    assert.ok(response.ok, `LIPAS ${id}: HTTP ${response.status}`);
    const site = await response.json();
    features.push(convert(site, id, fetchedAt));
    raw.push(site);
  }
  // Both responses must pass validation before any file is changed.
  const target = path.join(directory, 'nuuksio-laavut.geojson');
  let previous;
  try { previous = JSON.parse((await fs.readFile(target, 'utf8')).replace(/^\uFEFF/, '')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const changes = features.map(feature => {
    const old = previous?.features?.find(item => item.id === feature.id);
    const keys = Object.keys(feature.properties).filter(key => key !== 'fetched_at');
    const changed = keys.filter(key => !isDeepStrictEqual(old?.properties?.[key], feature.properties[key]));
    if (!isDeepStrictEqual(old?.geometry, feature.geometry)) changed.push('geometry');
    return { name: feature.properties.name, sourceId: feature.properties.source_id,
      changedFields: old ? changed.join(', ') || '(no source changes)' : '(new site)' };
  });
  await fs.mkdir(directory, { recursive: true });
  const runId = `${fetchedAt.replace(/[:.]/g, '-')}-${randomUUID()}`;
  const snapshot = path.join(directory, 'fetches', runId);
  await fs.mkdir(snapshot, { recursive: true });
  for (let i = 0; i < ids.length; i++) {
    await fs.writeFile(path.join(snapshot, `${ids[i]}.json`), JSON.stringify(raw[i], null, 2) + '\n');
  }
  await fs.writeFile(path.join(snapshot, 'summary.json'), JSON.stringify({ fetchedAt, changes }, null, 2) + '\n');
  const temporary = path.join(directory, `.preview-${runId}.tmp`);
  try {
    await fs.writeFile(temporary, JSON.stringify({ type: 'FeatureCollection', features }, null, 2) + '\n');
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { changes, fetchedAt, snapshot };
}

module.exports = { fetchPreview, convert };
if (require.main === module) {
  fetchPreview(path.resolve(__dirname, '../../data-preview/lipas'))
    .then(result => {
      console.table(result.changes);
      console.log(`Fetched: ${result.fetchedAt}\nRaw responses: ${result.snapshot}`);
      console.log('Preview updated. Database unchanged. To import: retki.cmd backend import:lipas-preview');
    })
    .catch(error => { console.error(`Fetch stopped: ${error.message}`); process.exitCode = 1; });
}
