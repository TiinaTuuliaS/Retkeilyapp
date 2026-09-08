// Rebuild the historical preview, then inspect fresh sports-sites and LOIs.
const { polygonPosition, polygons } = require('./preview-lipas-seitseminen.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
async function main() {
  const startedAt = new Date().toISOString();
  const dir = path.resolve(__dirname, '../../data-preview/lipas-seitseminen/checks', startedAt.replace(/[:.]/g,'-'));
  await fs.mkdir(dir, { recursive: true });
  const sources = {
    sports: 'https://api.lipas.fi/v2/sports-sites?city-codes=143,980&statuses=active,out-of-service-temporarily&page-size=100',
    lois: 'https://api.lipas.fi/v2/lois?statuses=active,out-of-service-temporarily&page-size=100',
  };
  const summary = { startedAt, sources, datasets: {} };
  const matches = [];
  for (const [collection, base] of Object.entries(sources)) {
    let pages = 1, total;
    const items = [];
    for (let page=1; page<=pages; page++) {
      assert.ok(page<=50);
      const response = await fetch(`${base}&page=${page}`, { signal: AbortSignal.timeout(30000) });
      assert.ok(response.ok, `HTTP ${response.status}`);
      const data = await response.json();
      if (page===1) { pages=data.pagination['total-pages']; total=data.pagination['total-items']; }
      assert.equal(data.pagination['current-page'],page);
      assert.equal(data.pagination['total-pages'],pages);
      assert.equal(data.pagination['total-items'],total);
      await fs.writeFile(path.join(dir,`${collection}-${page}.json`),JSON.stringify(data));
      items.push(...data.items);
    }
    assert.equal(items.length,total);
    assert.equal(new Set(items.map(s=>s['lipas-id'] || s.id)).size,total);
    const found=[];
    let nonPointGeometries=0;
    for (const item of items) {
      const geometries = collection==='sports' ? item.location?.geometries : item.geometries;
      for (const f of geometries?.features || []) {
        if (f.geometry?.type !== 'Point') { nonPointGeometries++; continue; }
        const positions=polygons.map(p=>polygonPosition(f.geometry.coordinates,p));
        if (positions.some(p=>p>0)) {
          const classification=positions.includes(2)?'boundary-review':'inside';
          found.push({id:item['lipas-id'] || item.id,name:item.name || null,type:item.type?.['type-code'] || item['loi-type'],classification});
          matches.push({collection,classification,item});
          break;
        }
      }
    }
    summary.datasets[collection]={total,nonPointGeometries,pointMatches:found};
    console.log(collection,JSON.stringify(summary.datasets[collection]));
  }
  summary.finishedAt=new Date().toISOString();
  await fs.writeFile(path.join(dir,'matches.json'),JSON.stringify(matches,null,2));
  await fs.writeFile(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));
  console.log('Saved complete check:',dir);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
