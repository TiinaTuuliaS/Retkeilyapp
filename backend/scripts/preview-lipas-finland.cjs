const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

async function main() {
  const startedAt = new Date().toISOString();
  const directory = path.resolve(__dirname, '../../data-preview/lipas-finland', startedAt.replace(/[:.]/g, '-'));
  await fs.mkdir(directory, { recursive: true });
  const get = async url => {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { Accept: 'application/json' } });
    assert.ok(response.ok, `${url}: HTTP ${response.status}`);
    return response.json();
  };
  const categories = [];
  for (const code of [301, 206]) categories.push(await get(`https://api.lipas.fi/v2/sports-site-categories/${code}`));
  await fs.writeFile(path.join(directory, 'categories.json'), JSON.stringify(categories, null, 2));
  const base = 'https://api.lipas.fi/v2/sports-sites?type-codes=301,206&statuses=active,out-of-service-temporarily&page-size=100';
  const sites = [];
  let totalPages = 1, totalItems;
  for (let page = 1; page <= totalPages; page++) {
    assert.ok(page <= 150, 'Unexpectedly large result; stopping');
    const result = await get(`${base}&page=${page}`);
    assert.equal(result.pagination['current-page'], page);
    if (page === 1) {
      totalPages = result.pagination['total-pages'];
      totalItems = result.pagination['total-items'];
    }
    assert.equal(result.pagination['total-items'], totalItems, 'Dataset changed during pagination; retry');
    assert.equal(result.pagination['total-pages'], totalPages);
    await fs.writeFile(path.join(directory, `page-${page}.json`), JSON.stringify(result));
    sites.push(...result.items);
    console.log(`Page ${page}/${totalPages}: ${sites.length}/${totalItems}`);
  }
  assert.equal(sites.length, totalItems);
  assert.equal(new Set(sites.map(s => s['lipas-id'])).size, sites.length, 'Duplicate IDs across pages');
  const counts = {}, provinces = {}, municipalities = {}, properties = {}, waterFields = {};
  let missingGeometry = 0, invalidGeometry = 0, missingName = 0, oldDates = 0;
  const features = [];
  for (const site of sites) {
    assert.ok([301,206].includes(site.type['type-code']));
    assert.ok(['active','out-of-service-temporarily'].includes(site.status));
    const type = site.type['type-code'];
    counts[type] = (counts[type] || 0) + 1;
    const province = site['search-meta']?.location?.province?.name?.fi || 'Tuntematon';
    provinces[province] = (provinces[province] || 0) + 1;
    const city = site.location?.city?.['city-code'] ?? 'unknown';
    const cityName = site['search-meta']?.location?.city?.name?.fi || String(city);
    municipalities[city] ??= { name: cityName, count: 0 };
    municipalities[city].count++;
    if (!site.name?.trim()) missingName++;
    if (Date.parse(site['event-date']) < Date.parse('2022-01-01')) oldDates++;
    for (const [key, value] of Object.entries(site.properties || {})) {
      properties[key] ??= { present: 0, yes: 0, no: 0 };
      properties[key].present++;
      if (value === true) properties[key].yes++;
      if (value === false) properties[key].no++;
    }
    function scan(value, prefix = '') {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        const next = prefix ? `${prefix}.${key}` : key;
        if (/water|vesi|kaivo|drinking/i.test(key) && !next.startsWith('search-meta')) {
          waterFields[next] ??= { count: 0, examples: [] };
          waterFields[next].count++;
          if (waterFields[next].examples.length < 3) waterFields[next].examples.push({ id: site['lipas-id'], value: child });
        }
        scan(child, next);
      }
    }
    scan(site);
    const geometries = site.location?.geometries?.features || [];
    if (!geometries.length) missingGeometry++;
    for (let i = 0; i < geometries.length; i++) {
      const g = geometries[i].geometry;
      if (g?.type !== 'Point' || !Array.isArray(g.coordinates) || g.coordinates.length < 2 ||
          !g.coordinates.slice(0,2).every(Number.isFinite) || Math.abs(g.coordinates[0]) > 180 || Math.abs(g.coordinates[1]) > 90) {
        invalidGeometry++; continue;
      }
      features.push({ type: 'Feature', id: `lipas:sports-sites:${site['lipas-id']}:${i}`, geometry: g,
        properties: { name: site.name, source_id: site['lipas-id'], type_code: type, province, city: cityName,
          status: site.status, source_event_date: site['event-date'], services: site.properties || {} } });
    }
  }
  const summary = { startedAt, finishedAt: new Date().toISOString(), source: base,
    scope: 'LIPAS sports-sites types 301 and 206; active and temporarily out of service; all pages. Not all Finnish hiking places.',
    total: sites.length, counts, statuses: sites.reduce((a,s)=>(a[s.status]=(a[s.status]||0)+1,a),{}),
    provinces, municipalities, properties, waterFields, missingGeometry, invalidGeometry, missingName,
    sourceEventBefore2022: oldDates, geojsonFeatures: features.length };
  await fs.writeFile(path.join(directory, 'sites.geojson'), JSON.stringify({ type: 'FeatureCollection', features }));
  await fs.writeFile(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ directory, ...summary, municipalities: Object.keys(municipalities).length }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
