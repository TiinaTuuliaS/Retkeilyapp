const fs=require('node:fs');
const path=require('node:path');
const {polygonPosition}=require('./osm-park-geometry.cjs');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'data-preview/osm-parks');
const summaries=[];
for(const park of ['lemmenjoki']){
  const raw=JSON.parse(fs.readFileSync(path.join(dir,park+'-raw.json'),'utf8'));
  const geom=JSON.parse(fs.readFileSync(path.join(root,'data-preview/lipas-'+park+'/boundary.geojson'),'utf8')).features[0].geometry;
  const polygons=geom.type==='Polygon'?[geom.coordinates]:geom.coordinates;
  const features=raw.elements.map(e=>{
    const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;
    if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('Missing position');
    const positions=polygons.map(p=>polygonPosition([lon,lat],p));
    const t=e.tags||{};
    const water=t.amenity==='drinking_water'||['water_well','water_tap'].includes(t.man_made)||t.natural==='spring';
    const rest=t.amenity==='shelter'||t.tourism==='picnic_site'||t.leisure==='firepit'||t.amenity==='bbq'||t.tourism==='wilderness_hut';
    const category=water?'water':rest?'rest':t.tourism==='camp_site'?'camp':t.leisure==='picnic_table'?'table':'water-tag-on-other-feature';
    return {type:'Feature',id:`osm:${e.type}:${e.id}`,geometry:{type:'Point',coordinates:[lon,lat]},properties:{
      sourceUrl:`https://www.openstreetmap.org/${e.type}/${e.id}`,name:t.name||t['name:fi']||null,
      category,classification:positions.includes(2)?'boundary-review':positions.includes(1)?'inside':'outside',
      positionKind:e.type==='node'?'osm-node':'bounding-box-center-review-required',
      osmModifiedAt:e.timestamp,osmVersion:e.version,tags:t}};
  });
  const inside=features.filter(f=>f.properties.classification==='inside');
  const counts={};for(const f of inside)counts[f.properties.category]=(counts[f.properties.category]||0)+1;
  const summary={park,fetchedAt:raw.fetchedAt,osmBase:raw.osmBase,bboxResults:features.length,inside:inside.length,
    outside:features.filter(f=>f.properties.classification==='outside').length,
    boundaryReview:features.filter(f=>f.properties.classification==='boundary-review').length,counts,
    areaCentersInside:inside.filter(f=>f.properties.positionKind!=='osm-node').length};
  summaries.push(summary);
  fs.writeFileSync(path.join(dir,park+'.geojson'),JSON.stringify({type:'FeatureCollection',features},null,2));
  const clean=v=>String(v??'Ei tietoa').replaceAll('|','/').replaceAll('\n',' ');
  const rows=inside.sort((a,b)=>a.properties.category.localeCompare(b.properties.category)||String(a.properties.name).localeCompare(String(b.properties.name),'fi')).map(f=>{
    const p=f.properties,t=p.tags;
    return `| [${clean(p.name||'Nimetön kohde')}](${p.sourceUrl}) | ${p.category} | ${clean(t.man_made||t.natural||t.shelter_type||t.amenity||t.tourism||t.leisure)} | ${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]} | ${clean(t.drinking_water)} | ${clean(t.access)} | ${clean(t['check_date:drinking_water']||t.check_date||t['survey:date'])} | ${p.osmModifiedAt} | ${p.positionKind} |`;
  });
  fs.writeFileSync(path.join(dir,park+'.md'),`# ${park}: OSM-esikatselu\n\nHaettu ${raw.fetchedAt}. Puiston sisälle osuvat pisteet ja alueiden hakulaatikoiden keskipisteet. Aluekohteiden tarkka geometria on tarkistettava ennen tuontia.\n\nOSM-muokkauspäivä ei ole maastohavainnon tai vesitutkimuksen päivä. Alkuperäiset ominaisuudet ovat GeoJSONissa.\n\n| Nimi ja lähde | Ryhmä | Tyyppi | Lat, lon | drinking_water | access | Tarkistuspäivämerkintä | OSM-muokkaus | Sijaintityyppi |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`);
}
fs.writeFileSync(path.join(dir,'lemmenjoki-summary.json'),JSON.stringify(summaries,null,2));
console.log(JSON.stringify(summaries,null,2));
