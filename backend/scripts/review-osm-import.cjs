const fs=require('node:fs'),{polygonPosition}=require('./osm-park-geometry.cjs');
const base='data-preview/osm-parks/';
const ways=JSON.parse(fs.readFileSync(base+'review-ways.json')).elements;
const distance=(a,b)=>{const r=Math.PI/180;const [x,y]=a,[u,v]=b;const z=Math.sin((v-y)*r/2)**2+Math.cos(y*r)*Math.cos(v*r)*Math.sin((u-x)*r/2)**2;return 6371000*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};
const approved={seitseminen:['osm:node:521874136','osm:node:521874512','osm:node:4337467394','osm:node:10591569867','osm:node:6583581389'],helvetinjarvi:['osm:node:534951519','osm:node:2312895980','osm:node:3646381763']};
const review={reviewedAt:new Date().toISOString(),databaseChanged:false,proposed:[],held:[],nearbyPairs:[],ways:[]};
for(const park of Object.keys(approved)){
const features=JSON.parse(fs.readFileSync(base+park+'.geojson')).features.filter(f=>f.properties.classification==='inside');
const g=JSON.parse(fs.readFileSync('data-preview/lipas-'+park+'/boundary.geojson')).features[0].geometry,polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
for(const f of features){const p=f.properties,t=p.tags;let reason;
if(approved[park].includes(f.id)){review.proposed.push({park,id:f.id,name:p.name||(park==='seitseminen'?'Nimetön kaivo (Seitseminen)':'Nimetön kaivo (Helvetinjärvi)'),geometry:f.geometry,tags:t,sourceUrl:p.sourceUrl,osmModifiedAt:p.osmModifiedAt,reason:'OSM node inside boundary; no explicit access/reservation restriction in snapshot. Current operation not verified.'});continue;}
if(t.reservation==='required'||t.fee==='yes')reason='Reservation/payment: keep out of initial unrestricted pilot';
else if(t.natural==='spring')reason='Natural spring; do not label as maintained water point';
else if(p.category==='table')reason='Furniture, not an independent destination';
else if(p.category==='water-tag-on-other-feature')reason='Water attribute on another feature, not a water point';
else reason='Review site grouping, name or area representative before import';
review.held.push({park,id:f.id,name:p.name,reason});}
for(let i=0;i<features.length;i++)for(let j=i+1;j<features.length;j++){const a=features[i],b=features[j];if(a.properties.category==='table'||b.properties.category==='table')continue;const d=distance(a.geometry.coordinates,b.geometry.coordinates);if(d<60)review.nearbyPairs.push({park,a:a.id,b:b.id,metres:Math.round(d),note:'Proximity only: may be separate structures, not duplicate records'});}
for(const w of ways.filter(w=>features.some(f=>f.id==='osm:way:'+w.id))){const points=w.geometry.map(p=>[p.lon,p.lat]);review.ways.push({park,id:w.id,name:w.tags.name||null,closed:w.nodes[0]===w.nodes.at(-1),vertices:points.length,allVerticesInside:points.every(p=>polys.some(poly=>polygonPosition(p,poly)>0)),note:'Vertex test only; no full polygon coverage or entrance validation.'});}
}
fs.writeFileSync(base+'import-review.json',JSON.stringify(review,null,2));
console.log(JSON.stringify({proposed:review.proposed.map(x=>({park:x.park,id:x.id,name:x.name})),held:review.held.length,nearbyPairs:review.nearbyPairs,ways:review.ways},null,2));
