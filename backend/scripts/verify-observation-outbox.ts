import 'reflect-metadata';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {NestFactory} from '@nestjs/core';
import {DataSource} from 'typeorm';
import request from 'supertest';
import {AppModule} from '../src/app.module';
import {frontendOrigin} from '../src/accounts/accounts';
async function main(){
  const app=await NestFactory.create(AppModule,{logger:false});await app.init();
  const db=app.get(DataSource),http=request(app.getHttpServer()),ids:number[]=[],cookies:string[]=[];
  const send=(i:number,body:any)=>http.post('/account/observations').set('Origin',frontendOrigin()).set('Cookie',cookies[i]).send(body);
  try{
    for(let i=0;i<2;i++){
      const r=await http.post('/auth/register').set('Origin',frontendOrigin()).send({email:`outbox-${randomBytes(12).toString('hex')}@example.invalid`,password:randomBytes(24).toString('hex'),displayName:'Outbox test'}).expect(201);
      ids.push(r.body.id);cookies.push(r.headers['set-cookie'][0].split(';')[0]);
    }
    const [loc]=await db.query('SELECT id FROM public.locations ORDER BY id LIMIT 1');
    const examples=[
      {kind:'report',table:'reports',data:{location:{id:loc.id},status:'ok',target:'general',comment:'Offline test'}},
      {kind:'water',table:'water_observations',data:{kind:'well',directions:'Offline test',availability:'unknown',observedOn:'2026-01-01'}},
      {kind:'usage',table:'usage_observations',data:{status:'unknown',comment:'Offline test',observedOn:'2026-01-01'}},
    ];
    await http.post('/account/observations').set('Origin',frontendOrigin()).send({}).expect(401);
    for(const example of examples){
      const body={requestId:randomUUID(),accountId:ids[0],kind:example.kind,locationId:loc.id,data:example.data};
      const results=await Promise.all([send(0,body).expect(201),send(0,body).expect(201),send(0,body).expect(201)]);
      assert.deepEqual(results[0].body,results[1].body);assert.deepEqual(results[0].body,results[2].body);
      const count=await db.query(`SELECT count(*)::int AS n FROM public.${example.table} WHERE account_id=$1`,[ids[0]]);assert.equal(count[0].n,1);
      await send(1,body).expect(400);
      await send(0,{...body,data:{...example.data,unexpected:'changed'}}).expect(409);
      const invalid={...body,requestId:randomUUID(),data:{...example.data,unexpected:'invalid'}};
      await send(0,invalid).expect(400);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM public.observation_receipts WHERE request_id=$1',[invalid.requestId]))[0].n,0);
    }
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.observation_receipts WHERE account_id=$1',[ids[0]]))[0].n,3);
    console.log('PASS: concurrent retries create one observation for all three kinds; cross-account writes, changed payloads and invalid data rejected; receipt rollback verified.');
  }finally{
    try{if(ids.length){for(const table of ['reports','water_observations','usage_observations'])await db.query(`DELETE FROM public.${table} WHERE account_id=ANY($1::int[])`,[ids]);await db.query('DELETE FROM public.accounts WHERE id=ANY($1::int[])',[ids]);}}finally{await app.close();}
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
