const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const base=path.join(root,'data-preview/osm-parks');fs.mkdirSync(base,{recursive:true});
const parks=['ukk','seitseminen','helvetinjarvi'];
async function main(){for(const park of parks){
const b=JSON.parse(fs.readFileSync(path.join(root,'data-preview/lipas-'+park+'/boundary.geojson'),'utf8')).features[0].geometry;
const polys=b.type==='Polygon'?[b.coordinates]:b.coordinates;const coords=polys.flat(2);
const box=[Math.min(...coords.map(p=>p[1])),Math.min(...coords.map(p=>p[0])),Math.max(...coords.map(p=>p[1])),Math.max(...coords.map(p=>p[0]))].join(',');
const filters=['["amenity"="drinking_water"]','["man_made"="water_well"]','["man_made"="water_tap"]','["natural"="spring"]','["drinking_water"]'];
if(park!=='ukk')filters.push('["amenity"="shelter"]','["tourism"="picnic_site"]','["leisure"="firepit"]','["amenity"="bbq"]','["tourism"="wilderness_hut"]','["tourism"="camp_site"]','["leisure"="picnic_table"]');
const query='[out:json][timeout:25];('+filters.map(f=>'nwr'+f+'('+box+');').join('')+');out center meta;';
fs.writeFileSync(path.join(base,park+'.overpass'),query);
let result;
for(const host of ['https://maps.mail.ru/osm/tools/overpass/api/interpreter']){
try {const r=await fetch(host+'?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(35000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(data.remark)throw Error(data.remark);result={fetchedAt:new Date().toISOString(),endpoint:host,query,osmBase:data.osm3s?.timestamp_osm_base,elements:data.elements.map(({user,uid,...item})=>item)};break;}catch(e){console.log(park,host,e.message);}}
if(!result){console.log('FAILED',park);process.exitCode=1;continue;}fs.writeFileSync(path.join(base,park+'-raw.json'),JSON.stringify(result,null,2));console.log('SAVED',park,result.elements.length);
}}
main().catch(e=>{console.error(e);process.exitCode=1});
