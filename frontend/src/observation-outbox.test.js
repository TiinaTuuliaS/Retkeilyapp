import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOutbox} from './observation-outbox.js';
function memory(){const rows=new Map();return {all:async()=>structuredClone([...rows.values()]),put:async x=>{rows.set(x.requestId,structuredClone(x));},remove:async id=>rows.delete(id)};}
const input={accountId:1,kind:'report',locationId:10,locationName:'Test',data:{location:{id:10},status:'ok',target:'general',comment:'Test'}};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
test('offline save survives a new queue instance, response loss retries same ID',async()=>{
  const store=memory(),received=[];let online=false,lost=true;
  const fetcher=async(url,options)=>{
    if(!online)throw new TypeError('offline');
    if(url.endsWith('/auth/me'))return json({id:1});
    received.push(JSON.parse(options.body));
    if(lost){lost=false;throw new TypeError('response lost');}
    return json({id:99});
  };
  const first=createOutbox({store,fetcher});const saved=await first.save(input);await first.flush(1);
  assert.equal((await store.all())[0].state,'pending');assert.equal(received.length,0);
  online=true;await first.flush(1);assert.equal((await store.all())[0].state,'pending');
  const reopened=createOutbox({store,fetcher});await reopened.flush(1);
  assert.equal((await store.all())[0].state,'sent');assert.equal(received.length,2);
  assert.equal(received[0].requestId,saved.requestId);assert.deepEqual(received[0],received[1]);
  await reopened.flush(1);assert.equal(received.length,2);
});
test('other accounts and expired sessions never submit another owner queue',async()=>{
  const store=memory();let calls=0;
  const out=createOutbox({store,fetcher:async url=>{calls++;assert.ok(url.endsWith('/auth/me'));return json({id:2});}});
  await out.save(input);await out.flush(2);assert.equal(calls,0);
  await out.flush(1);assert.equal((await store.all())[0].state,'auth');
});
test('server validation failure retained for inspection, not retried automatically',async()=>{
  const store=memory();let posts=0;
  const out=createOutbox({store,fetcher:async url=>url.endsWith('/auth/me')?json({id:1}):(posts++,json({message:'Kohde puuttuu'},404))});
  await out.save(input);await out.flush(1);await out.flush(1);
  const [item]=await store.all();assert.equal(item.state,'error');assert.equal(item.data.comment,'Test');assert.equal(posts,1);
  await out.flush(1,true);assert.equal(posts,2);
});
test('storage failure rejects save rather than claiming data is safe',async()=>{
  const out=createOutbox({store:{put:async()=>{throw Error('disk full');}},fetcher:async()=>{throw Error('must not send');}});
  await assert.rejects(out.save(input),/disk full/);
});
test('transient server failure and 401 retain original queue identity',async()=>{
  for(const status of [401,429,503]) {
    const store=memory(),out=createOutbox({store,fetcher:async url=>url.endsWith('/auth/me')?json({id:1}):json({},status)});
    const item=await out.save(input);await out.flush(1);
    const [saved]=await store.all();assert.equal(saved.requestId,item.requestId);assert.equal(saved.state,status===401?'auth':'pending');
  }
});
