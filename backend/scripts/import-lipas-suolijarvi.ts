import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { backendRoot, getDatabaseConfig } from '../database.config';

interface PreviewFeature {
  id: string;
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    name: string; type: string; source: string; source_collection: string;
    source_id: string; source_type_code: number; source_status: string;
    source_url: string; source_event_date: string; fetched_at: string;
    [key: string]: unknown;
  };
}

function readPreview(): PreviewFeature[] {
  return [607250, 609066].map(id => {
    const raw = JSON.parse(readFileSync(resolve(backendRoot, `../data-preview/suolijarvi/lipas-${id}.json`), 'utf8'));
    const site = raw.data;
    assert.equal(site['lipas-id'], id);
    assert.equal(site.status, 'active');
    assert.equal(site.type['type-code'], 206);
    assert.equal(site.location.city['city-code'], 837);
    assert.ok(typeof site.name === 'string' && site.name.trim());
    const features = site.location.geometries.features;
    assert.equal(features.length, 1);
    assert.equal(features[0].geometry.type, 'Point');
    const coords = features[0].geometry.coordinates;
    assert.equal(coords.length, 2);
    assert.ok(coords.every(Number.isFinite));
    assert.ok(coords[0] > 23.797 && coords[0] < 23.847 && coords[1] > 61.438 && coords[1] < 61.455,
      'Source moved outside the reviewed local test area.');
    assert.equal(raw.url, `https://api.lipas.fi/v2/sports-sites/${id}`);
    assert.ok(Number.isFinite(Date.parse(raw.fetchedAt)));
    assert.ok(Number.isFinite(Date.parse(site['event-date'])));
    for (const key of ['free-use?', 'toilet?']) {
      assert.ok(site.properties[key] === undefined || typeof site.properties[key] === 'boolean');
    }
    return { type: 'Feature', id: `lipas:sports-sites:${id}`, geometry: features[0].geometry,
      properties: { name: site.name, type: 'fireplace', source: 'lipas', source_collection: 'sports-sites',
        source_id: String(id), source_type_code: 206, source_status: site.status,
        source_url: raw.url, source_event_date: site['event-date'], fetched_at: raw.fetchedAt,
        free_use: site.properties['free-use?'] ?? null, toilet: site.properties['toilet?'] ?? null,
        water_point: ['year-round', 'seasonal'].includes(site.properties['water-point']) ? site.properties['water-point'] : null,
        address: site.location.address, municipality_code: 837, test_area: 'suolijarvi' } };
  });
}

async function importFeature(client: Client, feature: PreviewFeature) {
  const p = feature.properties;
  const key = [p.source, p.source_collection, p.source_id];
  const existing = await client.query(
    `SELECT location_id FROM public.location_sources
     WHERE source=$1 AND source_collection=$2 AND source_id=$3 FOR UPDATE`, key,
  );
  const [longitude, latitude] = feature.geometry.coordinates;
  let locationId: number;
  if (existing.rowCount) {
    locationId = existing.rows[0].location_id;
    const update = await client.query(
      `UPDATE public.locations SET name=$1, type=$2, longitude=$3, latitude=$4,
       geom=ST_SetSRID(ST_MakePoint($3,$4),4326) WHERE id=$5 RETURNING id`,
      [p.name, p.type, longitude, latitude, locationId],
    );
    assert.equal(update.rowCount, 1, 'Mapped location is missing.');
  } else {
    const nearby = await client.query(`SELECT id FROM public.locations WHERE
      ST_DWithin(geom::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,30)`, [longitude,latitude]);
    assert.equal(nearby.rowCount, 0, 'Nearby existing location requires duplicate review.');
    const inserted = await client.query(
      `INSERT INTO public.locations (name,type,longitude,latitude,geom)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($3,$4),4326)) RETURNING id`,
      [p.name, p.type, longitude, latitude],
    );
    locationId = inserted.rows[0].id;
  }
  await client.query(
    `INSERT INTO public.location_sources
       (source,source_collection,source_id,location_id,source_url,source_event_date,fetched_at,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (source,source_collection,source_id) DO UPDATE SET
       source_url=EXCLUDED.source_url, source_event_date=EXCLUDED.source_event_date,
       fetched_at=EXCLUDED.fetched_at, metadata=EXCLUDED.metadata, imported_at=now()`,
    [...key, locationId, p.source_url, p.source_event_date, p.fetched_at, JSON.stringify(p)],
  );
  return { name: p.name, sourceId: p.source_id, locationId,
    action: existing.rowCount ? 'updated' : 'added' };
}

async function main() {
  const features = readPreview(); // Validate everything before opening a transaction.
  const verify = process.argv.includes('--verify');
  const client = new Client({ ...getDatabaseConfig(), connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    // Serialize this importer, including concurrent first-time imports.
    await client.query('SELECT pg_advisory_xact_lock(73487,73853)');
    await client.query(readFileSync(resolve(backendRoot, 'migrations/001-location-sources.sql'), 'utf8'));
    const before = await client.query('SELECT count(*)::int AS count FROM public.locations');
    const waterBefore = await client.query("SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY id)::text, '[]')) AS hash FROM public.water_observations w");
    const reportsBefore = await client.query(
      "SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY id)::text, '[]')) AS hash FROM public.reports r",
    );
    const results: Awaited<ReturnType<typeof importFeature>>[] = [];
    for (const feature of features) results.push(await importFeature(client, feature));
    const after = await client.query('SELECT count(*)::int AS count FROM public.locations');
    assert.equal(after.rows[0].count - before.rows[0].count,
      results.filter(r => r.action === 'added').length);

    if (verify) {
      // A temporary report and source-name change exercise actual PostgreSQL behavior.
      // Everything in this verification transaction is rolled back.
      const locationId = results[0].locationId;
      const report = await client.query(
        `INSERT INTO public.reports (location_id,user_id,status,comment)
         VALUES ($1,1,'ok','Rollback-only import verification') RETURNING id`, [locationId],
      );
      const changed = structuredClone(features[0]);
      changed.properties.name = 'Rollback-only source-name change';
      const updated = await importFeature(client, changed);
      assert.equal(updated.locationId, locationId);
      const check = await client.query(
        `SELECT l.name, r.location_id FROM public.locations l
         JOIN public.reports r ON r.location_id=l.id WHERE r.id=$1`, [report.rows[0].id],
      );
      assert.equal(check.rows[0].name, changed.properties.name);
      assert.equal(check.rows[0].location_id, locationId);
      for (const feature of features) {
        const repeated = await importFeature(client, feature);
        assert.equal(repeated.action, 'updated');
        assert.equal(repeated.locationId, results.find(r => r.sourceId === repeated.sourceId)!.locationId);
      }
      const finalCount = await client.query('SELECT count(*)::int AS count FROM public.locations');
      assert.equal(finalCount.rows[0].count, after.rows[0].count);
      await client.query('ROLLBACK');
      console.log('Verification OK: repeat import, stable IDs and report retention. Test changes rolled back.');
    } else {
      const reportsAfter = await client.query(
        "SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY id)::text, '[]')) AS hash FROM public.reports r",
      );
      assert.equal(reportsAfter.rows[0].hash, reportsBefore.rows[0].hash,
        'Reports changed during import; rolling back.');
      const waterAfter = await client.query("SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY id)::text, '[]')) AS hash FROM public.water_observations w");
      assert.equal(waterAfter.rows[0].hash, waterBefore.rows[0].hash, 'Water observations changed; rolling back.');
      await client.query('COMMIT');
      console.table(results);
      console.log(`Locations: ${before.rows[0].count} -> ${after.rows[0].count}. Reports and water observations unchanged.`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Import failed.');
  process.exitCode = 1;
});
