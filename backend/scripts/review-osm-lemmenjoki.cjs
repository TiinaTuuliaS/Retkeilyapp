const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'../..');
const base = path.join(root,'data-preview/osm-parks');
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const all = read(path.join(base,'lemmenjoki.geojson')).features;
const inside = all.filter(f => f.properties.classification === 'inside');
const lipas = read(path.join(root,'data-preview/lipas-lemmenjoki/sites.geojson')).features;
function distance([x,y],[u,v]) {
  const rad = Math.PI/180;
  const a = Math.sin((v-y)*rad/2)**2 + Math.cos(y*rad)*Math.cos(v*rad)*Math.sin((u-x)*rad/2)**2;
  return 12742000*Math.asin(Math.sqrt(Math.min(1,a)));
}
const nearLipas = lipas.map(l => ({ lipasId:l.properties.source_id, name:l.properties.name,
  nearby:inside.map(f => ({ osmId:f.id, name:f.properties.name, metres:Math.round(distance(l.geometry.coordinates,f.geometry.coordinates)) }))
    .filter(f => f.metres <= 150).sort((a,b) => a.metres-b.metres) }));
const pairs = [];
for (let i=0;i<inside.length;i++) for (let j=i+1;j<inside.length;j++) {
  const a=inside[i],b=inside[j],metres=distance(a.geometry.coordinates,b.geometry.coordinates);
  if (metres<60) pairs.push({a:a.id,b:b.id,metres:Math.round(metres)});
}
const proposed = inside.filter(f => ['osm:node:4176627279','osm:node:4181473143','osm:node:4181554783'].includes(f.id));
assert.equal(proposed.length,3);
for (const f of proposed) {
  assert.equal(f.properties.positionKind,'osm-node');
  assert.equal(f.properties.tags.leisure,'firepit');
  assert.ok(!f.properties.tags.access || f.properties.tags.access==='yes');
  assert.notEqual(f.properties.tags.reservation,'required');
  assert.ok(lipas.every(l => distance(l.geometry.coordinates,f.geometry.coordinates)>150));
}
fs.writeFileSync(path.join(base,'lemmenjoki-review.json'),JSON.stringify({checkedAt:new Date().toISOString(),
  databaseChanged:false,nearLipas,nearbyOsmPairs:pairs,proposed:proposed.map(f=>f.id),
  caveat:'Proximity is not proof of a duplicate. Campsite fields are not merged into proposed firepit records.'},null,2));
fs.writeFileSync(path.join(base,'lemmenjoki-proposal.geojson'),JSON.stringify({type:'FeatureCollection',
  attribution:'© OpenStreetMap contributors',license:'https://opendatacommons.org/licenses/odbl/1-0/',features:proposed},null,2));
console.log(JSON.stringify({proposed:proposed.map(f=>f.properties.name),nearLipas},null,2));
