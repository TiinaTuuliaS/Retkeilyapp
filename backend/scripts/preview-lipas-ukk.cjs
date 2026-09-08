// Offline preview: no database access, no application data changes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'data-preview/lipas-ukk');
const sourceFile = 'data-preview/lipas-finland/2026-09-07T15-55-48-879Z/sites.geojson';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

// 0 outside, 1 inside, 2 on boundary. GeoJSON coordinates are longitude, latitude.
function ringPosition([x,y], ring) {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [ax,ay]=ring[j], [bx,by]=ring[i];
    const dx=bx-ax, dy=by-ay, length=Math.hypot(dx,dy);
    if (length > 0 && Math.abs(dx*(y-ay)-dy*(x-ax))/length < 1e-9 &&
        x >= Math.min(ax,bx)-1e-9 && x <= Math.max(ax,bx)+1e-9 &&
        y >= Math.min(ay,by)-1e-9 && y <= Math.max(ay,by)+1e-9) return 2;
    if ((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax) inside=!inside;
  }
  return inside ? 1 : 0;
}
function polygonPosition(point, rings) {
  const exterior=ringPosition(point,rings[0]);
  if (exterior!==1) return exterior;
  for (const hole of rings.slice(1)) {
    const position=ringPosition(point,hole);
    if (position===2) return 2;
    if (position===1) return 0;
  }
  return 1;
}
const square=[[0,0],[10,0],[10,10],[0,10],[0,0]];
assert.equal(polygonPosition([5,5],[square]),1);
assert.equal(polygonPosition([11,5],[square]),0);
assert.equal(polygonPosition([0,5],[square]),2);
assert.equal(polygonPosition([5,5],[square,[[4,4],[6,4],[6,6],[4,6],[4,4]]]),0);

const boundary=read(path.join(dir,'boundary.geojson'));
assert.equal(boundary.features.length,1);
assert.equal(boundary.features[0].properties.LsAlueTunn,'KPU120026');
const geometry=boundary.features[0].geometry;
assert.ok(['Polygon','MultiPolygon'].includes(geometry.type));
const polygons=geometry.type==='Polygon' ? [geometry.coordinates] : geometry.coordinates;
const coords=polygons.flat(2);
const bbox=[Math.min(...coords.map(p=>p[0]))-.3,Math.min(...coords.map(p=>p[1]))-.15,
  Math.max(...coords.map(p=>p[0]))+.3,Math.max(...coords.map(p=>p[1]))+.15];
const all=read(path.join(root,sourceFile)).features;
const features=all.filter(f=>{
  assert.equal(f.geometry.type,'Point');
  const [x,y]=f.geometry.coordinates;
  return x>=bbox[0] && y>=bbox[1] && x<=bbox[2] && y<=bbox[3];
}).map(f=>{
  const positions=polygons.map(p=>polygonPosition(f.geometry.coordinates,p));
  const classification=positions.includes(2)?'boundary-review':positions.includes(1)?'inside':'outside-in-preview-box';
  return {...f,properties:{...f.properties,park_classification:classification}};
});
assert.equal(new Set(features.map(f=>f.properties.source_id)).size,features.length);
const counts={};
for (const f of features) counts[f.properties.park_classification]=(counts[f.properties.park_classification]||0)+1;
const inside=features.filter(f=>f.properties.park_classification==='inside');
const summary={generatedAt:new Date().toISOString(),sourceFile,lipasSnapshotAt:'2026-09-07T15:55:48.879Z',
  boundarySource:'https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5',
  boundaryFetchedOn:'2026-09-08',boundaryId:'KPU120026',boundaryModifiedAt:new Date(boundary.features[0].properties.MuutosPvm).toISOString(),
  boundaryAttribution:'Metsähallitus / Syke, distribution GTK; CC BY 4.0',
  previewBbox:bbox,counts,insideServices:{toiletYes:inside.filter(f=>f.properties.services['toilet?']===true).length,
    waterKnown:inside.filter(f=>['year-round','seasonal'].includes(f.properties.services['water-point'])).length},
  scope:'Sports-sites 301 and 206 only. Not all park facilities. Outside means within the explicit preview box, not a fixed-distance buffer.'};
fs.writeFileSync(path.join(dir,'sites.geojson'),JSON.stringify({type:'FeatureCollection',features},null,2));
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));
const rows=features.sort((a,b)=>a.properties.name.localeCompare(b.properties.name,'fi')).map(f=>{
  const p=f.properties,s=p.services;
  return `| ${p.source_id} | ${p.name.replaceAll('|','/')} | ${p.park_classification} | ${p.type_code} | ${s['toilet?']===true?'Kyllä':s['toilet?']===false?'Ei':'Ei tietoa'} | ${s['water-point']||'Ei tietoa'} |`;
});
fs.writeFileSync(path.join(dir,'kohteet.md'),'# UKK-esikatselun kohteet\n\nLuokittelu koskee tallennettua aluerajaa. `inside` = sisällä, `outside-in-preview-box` = ulkopuolella hakulaatikossa, `boundary-review` = rajalla, tarkistettava. LIPAS-otos 7.9.2026, luokat 301 ja 206.\n\n| LIPAS-ID | Nimi | Sijaintiluokka | Tyyppikoodi | Käymälä | Vesipiste |\n| --- | --- | --- | --- | --- | --- |\n'+rows.join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
