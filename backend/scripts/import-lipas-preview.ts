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
  const path = resolve(backendRoot, '../data-preview/lipas/nuuksio-laavut.geojson');
  const data = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  assert.equal(data.type, 'FeatureCollection');
  assert.ok(Array.isArray(data.features) && data.features.length === 2,
    'This import requires exactly the two reviewed sites.');
  const ids = new Set<string>();
  for (const feature of data.features) {
    const p = feature.properties;
    assert.equal(feature.type, 'Feature');
    assert.ok(p && ['73487', '73851'].includes(p.source_id));
    assert.ok(!ids.has(p.source_id), 'Duplicate source ID.');
    ids.add(p.source_id);
    assert.equal(p.source, 'lipas');
    assert.equal(p.source_collection, 'sports-sites');
    assert.equal(feature.id, `lipas:sports-sites:${p.source_id}`);
    assert.equal(p.source_type_code, 301);
    assert.equal(p.type, 'lean_to');
    assert.equal(p.source_status, 'active');
    assert.ok(typeof p.name === 'string' && p.name.trim().length > 0);
    assert.equal(p.source_url, `https://api.lipas.fi/v2/sports-sites/${p.source_id}`);
    for (const date of [p.source_event_date, p.fetched_at]) {
      assert.ok(typeof date === 'string' && Number.isFinite(Date.parse(date)));
    }
    assert.equal(feature.geometry?.type, 'Point');
    const coordinates = feature.geometry.coordinates;
    assert.ok(Array.isArray(coordinates) && coordinates.length === 2);
    assert.ok(coordinates.every((n: unknown) => typeof n === 'number' && Number.isFinite(n)));
    // Limit this pilot to the reviewed Nuuksio vicinity, not all of Finland.
    assert.ok(coordinates[0] >= 24.4 && coordinates[0] <= 24.7);
    assert.ok(coordinates[1] >= 60.24 && coordinates[1] <= 60.4);
  }
  return data.features;
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
    await client.query('SELECT pg_advisory_xact_lock(73487,73851)');
    await client.query(readFileSync(resolve(backendRoot, 'migrations/001-location-sources.sql'), 'utf8'));
    const before = await client.query('SELECT count(*)::int AS count FROM public.locations');
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
      await client.query('COMMIT');
      console.table(results);
      console.log(`Locations: ${before.rows[0].count} -> ${after.rows[0].count}. Reports unchanged.`);
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
