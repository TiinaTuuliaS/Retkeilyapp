import { Client } from 'pg';
import { getDatabaseConfig } from '../database.config';

async function checkDatabase() {
  const client = new Client({
    ...getDatabaseConfig(),
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
  });

  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const result = await client.query(`
      SELECT current_database() AS database,
             to_regclass('public.locations') IS NOT NULL AS locations_exists,
             to_regclass('public.reports') IS NOT NULL AS reports_exists,
             EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS postgis_exists
    `);
    console.log('Database connection OK:', result.rows[0]);
    await client.query('ROLLBACK');
    if (!result.rows[0].locations_exists || !result.rows[0].reports_exists) {
      throw new Error('Required tables are missing. No tables were created.');
    }
  } finally {
    await client.end();
  }
}

checkDatabase().catch((error: unknown) => {
  const failure = error as { code?: string; message?: string };
  console.error('Database check failed:', failure.code ?? failure.message ?? 'Unknown error');
  process.exitCode = 1;
});
