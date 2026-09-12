const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '../../data-preview/suolijarvi');
async function main() {
  fs.mkdirSync(base, { recursive: true });
  for (const id of [607250, 609066]) {
    const url = `https://api.lipas.fi/v2/sports-sites/${id}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`LIPAS ${id}: ${response.status}`);
    const data = await response.json();
    fs.writeFileSync(path.join(base, `lipas-${id}.json`), JSON.stringify({ fetchedAt: new Date().toISOString(), url, data }, null, 2));
    console.log('LIPAS', id, JSON.stringify(data));
  }
  // Deliberately small research rectangle around Suolijärvi and Suolioja, not an official area boundary.
  const box = '61.438,23.797,61.455,23.847';
  const filters = ['[amenity=shelter]', '[leisure=firepit]', '[amenity=bbq]', '[tourism=picnic_site]', '[leisure=picnic_table]', '[amenity=drinking_water]', '[man_made=water_well]', '[man_made=water_tap]'];
  const query = '[out:json][timeout:25];(' + filters.map(f => `nwr${f}(${box});`).join('') + ');out center meta;';
  const url = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
  const response = await fetch(url + '?data=' + encodeURIComponent(query), { signal: AbortSignal.timeout(35000) });
  if (!response.ok) throw new Error(`OSM: ${response.status}`);
  const data = await response.json();
  if (data.remark) throw new Error(data.remark);
  const elements = data.elements.map(({ user, uid, ...item }) => item);
  fs.writeFileSync(path.join(base, 'osm-raw.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), url, query, elements }, null, 2));
  console.log('OSM', JSON.stringify(elements));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
