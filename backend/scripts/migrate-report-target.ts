import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { backendRoot, getDatabaseConfig } from '../database.config';

async function migrate() {
  const client = new Client({ ...getDatabaseConfig(), connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query(readFileSync(join(backendRoot, 'migrations/002-report-target.sql'), 'utf8'));
    await client.query('COMMIT');
    console.log('Raporttien kohdennus valmis. Vanhat raportit ovat yleisiä arvioita.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
migrate().catch(() => { console.error('Kohdennuksen tietokantapäivitys epäonnistui.'); process.exitCode = 1; });
