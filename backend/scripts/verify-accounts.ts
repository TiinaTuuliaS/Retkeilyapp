import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { frontendOrigin } from '../src/accounts/accounts';

async function main() {
  const app=await NestFactory.create(AppModule,{logger:false});
  await app.init();
  const db=app.get(DataSource);
  const http=request(app.getHttpServer());
  const ids:number[]=[];
  const password=randomBytes(24).toString('hex');
  const cookie=(r:any) => r.headers['set-cookie'][0].split(';')[0];
  const origin=frontendOrigin();
  try {
    const [place]=await db.query('SELECT id FROM public.locations ORDER BY id LIMIT 1');
    assert.ok(place,'Need a location for the integration test');
    await http.get('/account').expect(401);
    await http.post('/reports').set('Origin',origin).send({location:{id:place.id},status:'ok'}).expect(401);
    await http.post('/auth/register').set('Origin','https://untrusted.invalid').send({}).expect(403);
    const emails=[0,1].map(i=>`integration-${randomBytes(8).toString('hex')}-${i}@example.invalid`);
    const register=async (i:number) => {
      const r=await http.post('/auth/register').set('Origin',origin).send({email:emails[i],password,displayName:`Test account ${i}`}).expect(201);
      ids.push(r.body.id);
      assert.equal(r.body.role,'user');
      assert.ok(!r.body.password_hash);
      assert.match(r.headers['set-cookie'][0],/HttpOnly/);
      assert.match(r.headers['set-cookie'][0],/SameSite=Strict/);
      assert.equal(r.headers['cache-control'],'no-store');
      return cookie(r);
    };
    const a=await register(0),b=await register(1);
    await http.get('/account/journal').expect(401);
    await http.put('/account/profile').set('Origin',origin).set('Cookie',a).send({bio:'Retkeilijä',avatar:''}).expect(200);
    await http.get('/account/profile').set('Cookie',b).expect(200).expect(r=>assert.equal(r.body.bio,''));
    await http.put('/account/profile').set('Origin',origin).set('Cookie',a).send({bio:'x',avatar:'https://example.com/track.png'}).expect(400);
    await http.put('/account/profile').set('Origin',origin).set('Cookie',a).send({bio:'x',avatar:'',role:'admin'}).expect(400);
    const entry={title:'Retki',visitedOn:'2026-01-01',place:'Testipaikka',body:'Yksityinen muistiinpano'};
    await http.post('/account/journal').set('Origin',origin).set('Cookie',a).send({...entry,visitedOn:'2026-02-30'}).expect(400);
    await http.post('/account/journal').set('Origin',origin).set('Cookie',a).send({...entry,account_id:ids[1]}).expect(400);
    const created=await http.post('/account/journal').set('Origin',origin).set('Cookie',b).send(entry).expect(201);
    // Even an admin's private endpoints cannot read or edit another user's diary.
    await http.post('/auth/register').set('Origin',origin).send({email:emails[0],password,displayName:'Spoof',role:'admin'}).expect(400);
    await db.query("UPDATE public.accounts SET role='admin' WHERE id=$1",[ids[0]]);
    await http.get('/auth/me').set('Cookie',a).expect(200).expect(r=>assert.equal(r.body.role,'admin'));
    await http.get('/auth/me').set('Cookie',b).expect(200).expect(r=>assert.equal(r.body.role,'user'));
    await http.get('/account/journal').set('Cookie',a).expect(200).expect(r=>assert.equal(r.body.length,0));
    await http.put(`/account/journal/${created.body.id}`).set('Origin',origin).set('Cookie',a).send(entry).expect(404);
    await http.delete(`/account/journal/${created.body.id}`).set('Origin',origin).set('Cookie',a).expect(404);
    await http.put(`/account/journal/${created.body.id}`).set('Origin',origin).set('Cookie',b).send({...entry,title:'Muokattu'}).expect(200);
    await http.get('/account/journal').set('Cookie',b).expect(200).expect(r=>assert.equal(r.body[0].title,'Muokattu'));
    await http.delete(`/account/journal/${created.body.id}`).set('Origin',origin).set('Cookie',b).expect(200);
    await http.get('/account/journal').set('Cookie',b).expect(200).expect(r=>assert.equal(r.body.length,0));
    const initial=await http.get('/account').set('Cookie',a).expect(200);
    assert.equal(initial.body.observations.length,0,'Legacy reports must not be claimed');
    await http.get('/auth/me').set('Cookie',a).expect(200).expect(r=>assert.equal(r.body.id,ids[0]));
    await http.post('/auth/login').set('Origin',origin).send({email:emails[0],password:'wrong-password-long'}).expect(401);
    await http.post('/auth/register').set('Origin',origin).send({email:emails[0].toUpperCase(),password,displayName:'Duplicate'}).expect(409);
    const report={location:{id:place.id},status:'ok',target:'general',comment:'Account integration test'};
    await http.post('/reports').set('Origin',origin).set('Cookie',a).send({...report,account_id:ids[1]}).expect(400);
    await http.post('/reports').set('Origin',origin).set('Cookie',a).send(report).expect(201);
    const date='2026-01-01';
    await http.post(`/locations/${place.id}/water-observations`).set('Origin',origin).set('Cookie',a)
      .send({kind:'well',directions:'Account integration test',availability:'unknown',observedOn:date}).expect(201);
    await http.post(`/locations/${place.id}/usage-observations`).set('Origin',origin).set('Cookie',a)
      .send({status:'unknown',comment:'Account integration test',observedOn:date}).expect(201);
    for(let i=0;i<2;i++) await http.put(`/account/saved/${place.id}`).set('Origin',origin).set('Cookie',a).expect(200);
    const own=await http.get('/account').set('Cookie',a).expect(200);
    assert.equal(own.body.observations.length,3);
    assert.equal(own.body.saved.length,1);
    const other=await http.get('/account').set('Cookie',b).expect(200);
    assert.equal(other.body.observations.length,0); assert.equal(other.body.saved.length,0);
    await http.delete(`/account/saved/${place.id}`).set('Origin',origin).set('Cookie',b).expect(200);
    assert.equal((await http.get('/account').set('Cookie',a)).body.saved.length,1);
    await http.delete(`/account/saved/${place.id}`).set('Origin',origin).set('Cookie',a).expect(200);
    assert.equal((await http.get('/account').set('Cookie',a)).body.saved.length,0);
    const login=await http.post('/auth/login').set('Origin',origin).set('Cookie',a).send({email:emails[0],password}).expect(201);
    const renewed=cookie(login); assert.notEqual(renewed,a);
    await http.get('/account').set('Cookie',a).expect(401);
    await http.post('/auth/logout').set('Origin',origin).set('Cookie',renewed).expect(201);
    await http.get('/account').set('Cookie',renewed).expect(401);
    await db.query("UPDATE public.account_sessions SET expires_at=now()-interval '1 second' WHERE account_id=$1",[ids[1]]);
    await http.get('/account').set('Cookie',b).expect(401);
    console.log('PASS: registration, login, cookie flags, CSRF, authorization, ownership of all three report kinds, private saved sites, duplicates, session rotation, logout and expiry.');
  } finally {
    // Delete only records owned by accounts created by this test, never existing user data.
    if(ids.length) await db.transaction(async manager => {
      for(const table of ['reports','water_observations','usage_observations']) await manager.query(`DELETE FROM public.${table} WHERE account_id=ANY($1::int[])`,[ids]);
      await manager.query('DELETE FROM public.accounts WHERE id=ANY($1::int[])',[ids]);
    });
    await app.close();
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
