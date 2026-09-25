import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { backendRoot, getDatabaseConfig } from '../database.config';

// Explicit reviewed scope: refreshing the larger preview never expands this import.
const approvedIds = ['1167723560','1167723603','1167724010','1167723450','1167723549','1167723687','1167724100','1167724046','1167723770','915621349','1167723519','1167723987','1167723425','1167723657','649291366','10970967697'];
const read = (path: string) => JSON.parse(readFileSync(resolve(backendRoot, '..', path), 'utf8'));
function preview() {
  const data = read('data-preview/osm-parks/nuuksio-proposal.geojson');
  const review = { proposed: data.features.map(f => ({ ...f.properties, id:f.id, geometry:f.geometry, park:'nuuksio' })) };
  assert.equal(review.proposed.length, 16);
  const seen = new Set<string>();
  return review.proposed.map(p => {
    const id = p.id.split(':')[2];
    assert.ok(approvedIds.includes(id) && p.id === `osm:node:${id}`);
    assert.ok(!seen.has(id)); seen.add(id);
    const raw = read(`data-preview/osm-parks/${p.park}-raw.json`);
    const original = raw.elements.find(e => e.type === 'node' && String(e.id) === id);
    assert.ok(original);
    assert.deepEqual(p.geometry, { type: 'Point', coordinates: [original.lon, original.lat] });
    assert.deepEqual(p.tags, original.tags);
    assert.equal(p.sourceUrl, `https://www.openstreetmap.org/node/${id}`);
    assert.ok(typeof p.name === 'string' && p.name.trim());
    assert.ok(!p.tags.access || ['yes', 'public', 'permissive'].includes(p.tags.access));
    assert.ok(!p.tags.reservation || p.tags.reservation === 'no');
    assert.notEqual(p.tags.fee, 'yes');
    assert.ok(Number.isFinite(Date.parse(raw.fetchedAt)));
    assert.ok(Number.isFinite(Date.parse(original.timestamp)));
    const spec = read('data-preview/osm-parks/nuuksio-scope.json')[id];
    assert.equal(p.name, original.tags.name || original.tags['name:fi'] || spec.fallbackName);
    assert.equal(p.type, spec.type);
    assert.ok(!p.tags.indoor || p.tags.indoor === 'no');
    assert.ok(!p.tags.disused && !p.tags.abandoned && !p.tags['disused:amenity']);
    if (p.type === 'water') assert.ok(p.tags.amenity === 'drinking_water' && ['water_tap','water_well'].includes(p.tags.man_made));
    else if (p.type === 'campsite') assert.equal(p.tags.tourism, 'camp_site');
    else if (p.type === 'rest_shelter') assert.ok(p.tags.amenity === 'shelter' || p.tags.covered === 'yes');
    else { assert.equal(p.type, 'fireplace'); assert.ok(p.tags.leisure === 'firepit' || p.tags.fireplace === 'yes'); }
    const type = p.type;
    return { ...p, sourceId: id, type, fetchedAt: raw.fetchedAt,
      osmModifiedAt: original.timestamp, version: original.version };
  });
}

async function upsert(client: Client, p: ReturnType<typeof preview>[number]) {
  const existing = await client.query(`SELECT location_id FROM public.location_sources
    WHERE source='osm' AND source_collection='node' AND source_id=$1 FOR UPDATE`, [p.sourceId]);
  const [lon, lat] = p.geometry.coordinates;
  let id = existing.rows[0]?.location_id;
  if (id) {
    // Do not overwrite a location shared with another source or a manually merged record.
    const other = await client.query(`SELECT 1 FROM public.location_sources WHERE location_id=$1
      AND NOT (source='osm' AND source_collection='node' AND source_id=$2)`, [id, p.sourceId]);
    assert.equal(other.rowCount, 0, 'Mixed source location requires manual review.');
    const updated = await client.query(`UPDATE public.locations SET name=$1,type=$2,longitude=$3,latitude=$4,
      geom=ST_SetSRID(ST_MakePoint($3,$4),4326) WHERE id=$5 RETURNING id`, [p.name,p.type,lon,lat,id]);
    assert.equal(updated.rowCount, 1);
  } else {
    const nearby = await client.query(`SELECT id FROM public.locations WHERE
      ST_DWithin(geom::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,30)`, [lon,lat]);
    assert.equal(nearby.rowCount, 0, `Existing location within 30m of ${p.name}; review before adding.`);
    const inserted = await client.query(`INSERT INTO public.locations(name,type,longitude,latitude,geom)
      VALUES($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($3,$4),4326)) RETURNING id`, [p.name,p.type,lon,lat]);
    id = inserted.rows[0].id;
  }
  const metadata = { park: p.park, name: p.name, type: p.type, tags: p.tags,
    name_generated: p.nameGenerated, osm_version: p.version, license: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' };
  await client.query(`INSERT INTO public.location_sources
    (source,source_collection,source_id,location_id,source_url,source_event_date,fetched_at,metadata)
    VALUES('osm','node',$1,$2,$3,$4,$5,$6)
    ON CONFLICT(source,source_collection,source_id) DO UPDATE SET
    source_url=EXCLUDED.source_url,source_event_date=EXCLUDED.source_event_date,
    fetched_at=EXCLUDED.fetched_at,metadata=EXCLUDED.metadata,imported_at=now()`,
  [p.sourceId,id,p.sourceUrl,p.osmModifiedAt,p.fetchedAt,JSON.stringify(metadata)]);
  return { id, name: p.name, action: existing.rowCount ? 'updated' : 'added' };
}

async function observations(client: Client) {
  // Only hashes leave PostgreSQL: no user report text is printed.
  const result = await client.query(`SELECT
    (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY id)::text,'[]')) FROM public.reports r) AS reports,
    (SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY id)::text,'[]')) FROM public.water_observations w) AS water,
    (SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'[]')) FROM public.usage_observations u) AS usage`);
  return result.rows[0];
}
async function main() {
  const points = preview();
  const verify = process.argv.includes('--verify');
  const client = new Client({ ...getDatabaseConfig(), connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL statement_timeout='15s'");
    await client.query('SELECT pg_advisory_xact_lock(73487,73861)');
    await client.query(readFileSync(resolve(backendRoot,'migrations/001-location-sources.sql'),'utf8'));
    for (const p of points) {
      const geometry = read(`data-preview/lipas-${p.park}/boundary.geojson`).features[0].geometry;
      const inside = await client.query(`SELECT ST_Covers(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),
        ST_SetSRID(ST_MakePoint($2,$3),4326)) AS inside`, [JSON.stringify(geometry),...p.geometry.coordinates]);
      assert.equal(inside.rows[0].inside, true, `${p.name} outside park`);
    }
    const before = await observations(client);
    const count = async () => (await client.query('SELECT count(*)::int AS n FROM public.locations')).rows[0].n;
    const initialCount = await count();
    const results: Awaited<ReturnType<typeof upsert>>[] = [];
    for (const p of points) results.push(await upsert(client,p));
    assert.equal(await count(), initialCount + results.filter(r => r.action === 'added').length);
    assert.deepEqual(await observations(client), before, 'User observations changed.');
    if (verify) {
      const waterId = results[0].id;
      await client.query(`INSERT INTO public.reports(location_id,user_id,status,comment,target)
        VALUES($1,1,'ok','Rollback-only OSM verification','general')`, [waterId]);
      await client.query(`INSERT INTO public.water_observations(location_id,user_id,kind,directions,availability,observed_on)
        VALUES($1,1,'well','Rollback-only OSM verification','unknown',CURRENT_DATE)`, [waterId]);
      await client.query(`INSERT INTO public.usage_observations(location_id,user_id,status,comment,observed_on) VALUES($1,1,'unknown','Rollback-only OSM verification',CURRENT_DATE)`, [waterId]);
      const seeded = await observations(client);
      const n = await count();
      for (const [i,p] of points.entries()) {
        const repeated = await upsert(client,{ ...p, name: `${p.name} verification` });
        assert.equal(repeated.action, 'updated');
        assert.equal(repeated.id, results[i].id);
        const saved = await client.query('SELECT name FROM public.locations WHERE id=$1',[repeated.id]);
        assert.equal(saved.rows[0].name, `${p.name} verification`);
      }
      assert.equal(await count(), n);
      assert.deepEqual(await observations(client), seeded);
      await client.query('ROLLBACK');
      console.log('Verified: park boundaries, repeat import, stable IDs, source updates, reports and water observations retained. All test changes rolled back.');
    } else {
      await client.query('COMMIT');
      console.table(results);
      console.log('OSM pilot imported. Reports and water observations unchanged.');
    }
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
