import { Client } from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { backendRoot, getDatabaseConfig } from '../database.config';

// Local operator command only: never expose promotion through registration.
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const db = new Client({ ...getDatabaseConfig(), connectionTimeoutMillis: 5000 });
  try {
    await db.connect();
    await db.query('BEGIN');
    await db.query("SET LOCAL lock_timeout = '5s'");
    await db.query(readFileSync(join(backendRoot, 'migrations/006-account-roles.sql'), 'utf8'));
    if (email) {
      const result = await db.query("UPDATE public.accounts SET role='admin' WHERE email=$1 RETURNING id, role", [email]);
      if (result.rowCount !== 1) throw new Error('Registered account not found; no changes made.');
      console.log(`Account ${result.rows[0].id}: ${result.rows[0].role}`);
    }
    await db.query('COMMIT');
    console.log('Account roles ready.');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
