import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { backendRoot, getDatabaseConfig } from '../database.config';

async function main() {
  const client = new Client({ ...getDatabaseConfig(), connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    const locations = await client.query('SELECT * FROM public.locations WHERE id=4 FOR UPDATE');
    if (!locations.rowCount) {
      await client.query('ROLLBACK');
      console.log('UKK test location already absent.');
      return;
    }
    assert.equal(locations.rows[0].name, 'UKK laavu testi');
    const sources = await client.query('SELECT * FROM public.location_sources WHERE location_id=4');
    assert.equal(sources.rowCount, 0, 'Refusing to remove a source-backed location.');
    const reports = await client.query('SELECT * FROM public.reports WHERE location_id=4 FOR UPDATE');
    const directory = resolve(backendRoot, '../.repo-backups');
    mkdirSync(directory, { recursive: true });
    const file = resolve(directory, `ukk-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(file, JSON.stringify({ locations: locations.rows, reports: reports.rows }, null, 2), { flag: 'wx' });
    await client.query('DELETE FROM public.reports WHERE location_id=4');
    const deleted = await client.query("DELETE FROM public.locations WHERE id=4 AND name='UKK laavu testi'");
    assert.equal(deleted.rowCount, 1);
    await client.query('COMMIT');
    console.log(`Removed UKK test location and ${reports.rowCount} related test reports. Backup: ${file}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
