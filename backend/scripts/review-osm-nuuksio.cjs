const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'../..');
const base = path.join(root,'data-preview/osm-parks');
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const all = read(path.join(base,'nuuksio.geojson')).features;
const inside = all.filter(f => f.properties.classification === 'inside');
const lipas = read(path.join(root,'data-preview/lipas-nuuksio/sites.geojson')).features;
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
const scope = read(path.join(base,'nuuksio-scope.json'));
const proposed = inside.filter(f => f.id.startsWith('osm:node:') && scope[f.id.split(':')[2]]).map(f => { const item=scope[f.id.split(':')[2]]; return {...f,properties:{...f.properties,name:f.properties.name || item.fallbackName,type:item.type,nameGenerated:!f.properties.name}}; });
assert.equal(proposed.length,16);
for (const f of proposed) {
  assert.equal(f.properties.positionKind,'osm-node');
  assert.ok(['rest','camp','water'].includes(f.properties.category));
  assert.ok(!f.properties.tags.access || f.properties.tags.access==='yes');
  assert.notEqual(f.properties.tags.reservation,'required');
  assert.ok(lipas.every(l => distance(l.geometry.coordinates,f.geometry.coordinates)>150));
}
fs.writeFileSync(path.join(base,'nuuksio-review.json'),JSON.stringify({checkedAt:new Date().toISOString(),
  databaseChanged:false,nearLipas,nearbyOsmPairs:pairs,proposed:proposed.map(f=>f.id),
  caveat:'Proximity is not proof of a duplicate. Nearby feature fields are not merged. Water labels without source names are descriptive generated labels.'},null,2));
fs.writeFileSync(path.join(base,'nuuksio-proposal.geojson'),JSON.stringify({type:'FeatureCollection',
  attribution:'© OpenStreetMap contributors',license:'https://opendatacommons.org/licenses/odbl/1-0/',features:proposed},null,2));
console.log(JSON.stringify({proposed:proposed.map(f=>f.properties.name),nearLipas},null,2));
