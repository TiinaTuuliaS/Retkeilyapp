import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { backendRoot, getDatabaseConfig } from '../database.config';

const expected = [
  {id:1,name:'Nuuksio vesipiste',longitude:24.5147,latitude:60.3139},
  {id:6,name:'Haukanholman tulentekopaikka',longitude:24.5147,latitude:60.3139},
  {id:7,name:'Haukanholman vesipiste',longitude:24.516,latitude:60.3145},
];
async function main() {
  const db = new Client({...getDatabaseConfig(),connectionTimeoutMillis:5000});
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query("SET LOCAL lock_timeout='5s'");
    const ids=expected.map(x=>x.id);
    const locations=(await db.query('SELECT * FROM public.locations WHERE id=ANY($1::int[]) FOR UPDATE',[ids])).rows;
    for(const row of locations) {
      const match=expected.find(x=>x.id===row.id)!;
      assert.equal(row.name,match.name);
      assert.ok(Math.abs(Number(row.longitude)-match.longitude)<0.0000001);
      assert.ok(Math.abs(Number(row.latitude)-match.latitude)<0.0000001);
    }
    const tables=['location_sources','reports','water_observations','usage_observations','saved_locations','favorites'];
    const refs=await db.query(`SELECT DISTINCT c.conrelid::regclass::text AS name FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.locations'::regclass`);
    for(const row of refs.rows) assert.ok(tables.includes(row.name.replace(/^public\./,'')),`Unexpected reference: ${row.name}`);
    const backup:Record<string,unknown>={createdAt:new Date().toISOString(),reason:'Removal of three unverified Nuuksio development locations; observations are not reassigned.',locations};
    for(const table of tables) {
      // Table names are a fixed local allowlist.
      const rows=(await db.query(`SELECT * FROM public.${table} WHERE location_id=ANY($1::int[]) FOR UPDATE`,[ids])).rows;
      backup[table]=rows;
      console.log(`${table}: ${rows.length}`);
      if(table==='location_sources') assert.equal(rows.length,0,'Refusing to delete source-backed locations.');
    }
    console.log(`Matched development locations: ${locations.length}`);
    if(!process.argv.includes('--apply') || !locations.length) {await db.query('ROLLBACK');return;}
    const directory=resolve(backendRoot,'../.repo-backups');mkdirSync(directory,{recursive:true});
    const file=resolve(directory,`nuuksio-tests-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
    writeFileSync(file,JSON.stringify(backup,null,2),{flag:'wx'});
    for(const table of tables.filter(t=>t!=='location_sources')) await db.query(`DELETE FROM public.${table} WHERE location_id=ANY($1::int[])`,[ids]);
    const removed=await db.query('DELETE FROM public.locations WHERE id=ANY($1::int[])',[ids]);
    assert.equal(removed.rowCount,locations.length);
    await db.query('COMMIT');
    console.log(`Removed ${removed.rowCount} development locations. Backup: ${file}`);
  } catch(e) {await db.query('ROLLBACK');throw e;} finally {await db.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
