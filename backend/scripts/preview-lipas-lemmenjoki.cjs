const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { polygonPosition } = require('./osm-park-geometry.cjs');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'data-preview/lipas-lemmenjoki');
async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert.ok(r.ok, `HTTP ${r.status}`);
  return r.json();
}
async function main() {
  fs.mkdirSync(dir, { recursive: true });
  const endpoint = 'https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5';
  const query = new URLSearchParams({ where: "Nimi LIKE '%Lemmenjo%'", outFields: '*', outSR: '4326', f: 'geojson' });
  const boundary = await get(endpoint + '/query?' + query);
  assert.equal(boundary.features?.length, 1, 'Expected one Lemmenjo boundary');
  assert.ok(boundary.features[0].properties.Nimi.includes('Lemmenjo'));
  fs.writeFileSync(path.join(dir, 'boundary.geojson'), JSON.stringify(boundary));
  const g = boundary.features[0].geometry;
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const classify = point => {
    const positions = polygons.map(p => polygonPosition(point,p));
    return positions.includes(2) ? 'boundary-review' : positions.includes(1) ? 'inside' : 'outside';
  };
  const snapshot = 'data-preview/lipas-finland/2026-09-07T15-55-48-879Z/sites.geojson';
  const candidates = JSON.parse(fs.readFileSync(path.join(root,snapshot),'utf8')).features
    .filter(f => f.geometry.type === 'Point' && classify(f.geometry.coordinates) !== 'outside');
  const ids = [...new Set(candidates.map(f => f.properties.source_id))];
  const raw = [], features = [];
  for (const id of ids) {
    const url = `https://api.lipas.fi/v2/sports-sites/${id}`;
    const site = await get(url);
    assert.equal(site['lipas-id'], id);
    raw.push({ fetchedAt: new Date().toISOString(), url, site });
    for (const f of site.location?.geometries?.features || []) {
      if (f.geometry?.type !== 'Point') continue;
      features.push({ type: 'Feature', id: `lipas:sports-sites:${id}`, geometry: f.geometry,
        properties: { source_id: id, name: site.name, type_code: site.type['type-code'], status: site.status,
          classification: classify(f.geometry.coordinates), services: site.properties,
          source_url: url, source_event_date: site['event-date'] } });
    }
    console.log('Checked', id, site.name);
  }
  fs.writeFileSync(path.join(dir,'raw.json'),JSON.stringify(raw,null,2));
  fs.writeFileSync(path.join(dir,'sites.geojson'),JSON.stringify({type:'FeatureCollection',features},null,2));
  const eligible = features.filter(f => f.properties.classification === 'inside' && f.properties.status === 'active' && [301,206].includes(f.properties.type_code));
  const summary = { checkedAt: new Date().toISOString(), boundarySource: endpoint, boundaryProperties: boundary.features[0].properties,
    boundaryAttribution: 'Metsähallitus / Syke, jakelu GTK · CC BY 4.0', snapshot, candidates: ids.length,
    eligible: eligible.length, toiletKnown: eligible.filter(f => typeof f.properties.services['toilet?'] === 'boolean').length,
    waterKnown: eligible.filter(f => ['year-round','seasonal'].includes(f.properties.services['water-point'])).length,
    limitation: 'Candidates from 2026-09-07 snapshot, types 301 and 206 only. Individual records refreshed; newly added sites may be missing. No database changes.' };
  fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));
  const rows = features.map(f => { const p=f.properties; return `| ${p.source_id} | ${p.name.replaceAll('|','/')} | ${p.type_code} | ${p.status} | ${p.classification} | ${p.services['toilet?'] === true ? 'Kyllä' : p.services['toilet?'] === false ? 'Ei' : 'Ei tietoa'} | ${p.services['water-point'] || 'Ei tietoa'} |`; });
  fs.writeFileSync(path.join(dir,'kohteet.md'),'# Lemmenjoen tuontiehdotus\n\nLIPAS-luokat 301 (laavu, kota tai kammi) ja 206 (tulentekopaikka). Ei vielä tuotu sovellukseen.\n\n| LIPAS-ID | Kohde | Tyyppi | Tila | Rajatarkistus | Käymälä | Vesipiste |\n| --- | --- | --- | --- | --- | --- | --- |\n'+rows.join('\n')+'\n');
  console.log(JSON.stringify(summary));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
