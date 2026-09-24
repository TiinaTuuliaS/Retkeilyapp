import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { frontendOrigin } from '../src/accounts/accounts';

async function main() {
  const app=await NestFactory.create(AppModule,{logger:false});await app.init();
  const db=app.get(DataSource),http=request(app.getHttpServer()),ids:number[]=[],cookies:string[]=[];
  const call=(method:string,path:string,who:number,body?:unknown)=>{
    const req=http[method](path).set('Origin',frontendOrigin()).set('Cookie',cookies[who]);
    return body===undefined?req:req.send(body);
  };
  try {
    for(let i=0;i<3;i++) {
      const r=await http.post('/auth/register').set('Origin',frontendOrigin()).send({email:`social-${randomBytes(12).toString('hex')}@example.invalid`,password:randomBytes(24).toString('hex'),displayName:`Social test ${i}`}).expect(201);
      ids.push(r.body.id);cookies.push(r.headers['set-cookie'][0].split(';')[0]);
    }
    for(const path of ['/account/friends','/account/trips','/account/feed']) await http.get(path).expect(401);
    const entry={title:'Private test',body:'Private body',place:'Test park',visitedOn:'2026-09-01',animal:'Kuukkeli'};
    const j=await call('post','/account/journal',0,entry).expect(201),jid=j.body.id;
    const has=(r:any)=>r.body.some(x=>x.id===jid);
    assert.equal(j.body.visibility,'private');
    assert.equal(has(await http.get('/community').expect(200)),false);
    await call('put',`/account/journal/${jid}/visibility`,1,{visibility:'public'}).expect(404);
    await call('put',`/account/journal/${jid}/visibility`,0,{visibility:'friends'}).expect(200);
    await call('post',`/account/friends/${ids[1]}`,0).expect(201);
    await call('post',`/account/friends/${ids[0]}`,1).expect(201);
    assert.equal((await call('get','/account/friends',0).expect(200)).body.length,1);
    assert.equal(has(await call('get','/account/feed',1).expect(200)),false);
    await call('put',`/account/friends/${ids[1]}`,0).expect(404);
    await call('put',`/account/friends/${ids[0]}`,1).expect(200);
    assert.equal(has(await call('get','/account/feed',1).expect(200)),true);
    assert.equal(has(await call('get','/account/feed',2).expect(200)),false);
    await call('put',`/account/journal/${jid}/visibility`,0,{visibility:'public'}).expect(200);
    const publicFeed=await http.get('/community').expect(200);
    assert.equal(has(publicFeed),true);assert.equal(publicFeed.body.find(x=>x.id===jid).animal,'Kuukkeli');
    assert.ok(!('email' in publicFeed.body.find(x=>x.id===jid)));
    await call('put',`/account/journal/${jid}/visibility`,0,{visibility:'private'}).expect(200);
    assert.equal(has(await http.get('/community').expect(200)),false);
    const plan={title:'Retki',destination:'Testikohde',startsOn:'2026-10-01',endsOn:'2026-10-02',notes:'Yhteinen salainen muistio'};
    await call('post','/account/trips',0,{...plan,endsOn:'2026-09-30'}).expect(400);
    await call('post','/account/trips',0,{...plan,owner:ids[1]}).expect(400);
    const trip=await call('post','/account/trips',0,plan).expect(201),tid=trip.body.id;
    await call('post',`/account/trips/${tid}/invites/${ids[2]}`,0).expect(400);
    await call('post',`/account/trips/${tid}/invites/${ids[1]}`,0).expect(201);
    assert.equal((await call('get','/account/trips',1)).body[0].notes,'');
    assert.equal((await call('get','/account/trips',2)).body.length,0);
    await call('put',`/account/trips/${tid}/notes`,1,{notes:'No',previousNotes:plan.notes}).expect(404);
    await call('put',`/account/trips/${tid}/join`,2).expect(404);
    await call('put',`/account/trips/${tid}/join`,1).expect(200);
    assert.equal((await call('get','/account/trips',1)).body[0].notes,plan.notes);
    await call('put',`/account/trips/${tid}`,1,{...plan,previousNotes:plan.notes}).expect(404);
    await call('delete',`/account/trips/${tid}`,1).expect(404);
    await call('put',`/account/trips/${tid}/notes`,1,{notes:'Updated',previousNotes:plan.notes}).expect(200);
    await call('put',`/account/trips/${tid}/notes`,0,{notes:'Stale',previousNotes:plan.notes}).expect(409);
    await call('put',`/account/trips/${tid}`,0,{...plan,notes:'Updated',previousNotes:'Updated',title:'Uusi nimi'}).expect(200);
    await call('put',`/account/journal/${jid}/visibility`,0,{visibility:'friends'}).expect(200);
    await call('delete',`/account/friends/${ids[1]}`,0).expect(200);
    assert.equal(has(await call('get','/account/feed',1)),false);
    assert.equal((await call('get','/account/trips',1)).body.length,1,'Trips have separate memberships');
    await call('delete',`/account/trips/${tid}/members/${ids[1]}`,1).expect(200);
    assert.equal((await call('get','/account/trips',1)).body.length,0);
    await call('put',`/account/trips/${tid}/notes`,1,{notes:'No access',previousNotes:'Updated'}).expect(404);
    await call('delete',`/account/trips/${tid}`,0).expect(200);
    assert.equal((await call('get','/account/trips',0)).body.length,0);
    console.log('PASS: private/friends/public publishing, animals, friend consent/revocation, trip invites, member/owner permissions, concurrent notes and leave/delete.');
  } finally {
    try {if(ids.length) await db.query('DELETE FROM public.accounts WHERE id=ANY($1::int[])',[ids]);} finally {await app.close();}
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
