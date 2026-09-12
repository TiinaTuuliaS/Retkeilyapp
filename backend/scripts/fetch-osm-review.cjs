const fs=require('node:fs');
async function main(){const query='[out:json][timeout:25];way(id:746219969,746232695,1136163508,1216167978,295560836,360036787,360052704,972046272);out geom meta;';
const endpoint='https://maps.mail.ru/osm/tools/overpass/api/interpreter';
const r=await fetch(endpoint+'?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(35000)});
if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(d.remark)throw Error(d.remark);if(d.elements.length!==8)throw Error('Expected 8 ways');
fs.writeFileSync('data-preview/osm-parks/review-ways.json',JSON.stringify({fetchedAt:new Date().toISOString(),endpoint,query,elements:d.elements.map(({user,uid,...x})=>x)},null,2));console.log('Saved all 8 complete way geometries');}
main().catch(e=>{console.error(e.message);process.exitCode=1});
