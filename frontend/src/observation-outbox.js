const database = () => new Promise((resolve,reject) => {
  const request=indexedDB.open('konkari-observations',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('outbox',{keyPath:'requestId'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(Error('Laitteen tallennustila ei ole käytettävissä. Havainto jäi lomakkeelle.'));
});
async function transaction(mode,action) {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('outbox',mode),request=action(tx.objectStore('outbox'));
    tx.oncomplete=()=>{db.close();resolve(request.result);};
    tx.onabort=tx.onerror=()=>{db.close();reject(Error('Tallennus laitteelle epäonnistui. Havainto jäi lomakkeelle.'));};
  });
}
export const deviceStore={
  all:()=>transaction('readonly',s=>s.getAll()),
  put:item=>transaction('readwrite',s=>s.put(item)),
  remove:id=>transaction('readwrite',s=>s.delete(id)),
};

// Dependencies are injectable so lost responses/restarts can be tested without a browser.
export function createOutbox({store,fetcher,notify=()=>{},api='http://localhost:3000'}) {
  let running=null;
  const persist=async item=>{await store.put(item);notify();};
  async function deliver(accountId,retryErrors=false) {
    const entries=(await store.all()).filter(x=>x.accountId===accountId&&x.state!=='sent'&&(retryErrors||x.state!=='error'));
    if(!entries.length) return;
    let identity;
    try {
      const auth=await fetcher(`${api}/auth/me`,{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!auth.ok) throw Error();
      const body=await auth.text();identity=body?JSON.parse(body):null;
    } catch {return;}
    if(identity?.id!==accountId) {
      for(const entry of entries) await persist({...entry,state:'auth',message:'Kirjaudu samalle tilille lähettääksesi havainnon.'});
      return;
    }
    for(const entry of entries) {
      const {requestId,kind,locationId,data}=entry;
      try {
        const response=await fetcher(`${api}/account/observations`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({requestId,accountId,kind,locationId,data})});
        if(response.status===401||response.status===403) {
          await persist({...entry,state:'auth',message:'Kirjaudu samalle tilille lähettääksesi havainnon.'});return;
        }
        if(response.status>=500||response.status===429) {await persist({...entry,state:'pending',message:'Palvelimeen ei saada yhteyttä. Yritetään myöhemmin uudelleen.'});return;}
        const result=await response.json();
        if(!response.ok) {
          await persist({...entry,state:'error',message:typeof result.message==='string'?result.message:'Palvelin ei hyväksynyt havaintoa.'});continue;
        }
        await persist({...entry,state:'sent',result,message:'Lähetetty',sentAt:new Date().toISOString()});
        notify({kind,locationId,result,accountId});
      } catch {
        // The server may have committed before the connection failed. Keep the
        // original request ID so every retry is safe, including after a restart.
        await persist({...entry,state:'pending',message:'Odottaa yhteyttä. Havainto on tallessa tällä laitteella.'});return;
      }
    }
  }
  return {
    async save({accountId,kind,locationId,locationName,data}) {
      if(!Number.isInteger(accountId)) throw Error('Kirjaudu ennen havainnon tallentamista.');
      const entry={requestId:crypto.randomUUID(),accountId,kind,locationId,locationName,data:structuredClone(data),createdAt:new Date().toISOString(),state:'pending',message:'Odottaa lähetystä'};
      await persist(entry);return entry;
    },
    flush(accountId,retryErrors=false) {
      if(running) return running;
      const work=()=>deliver(accountId,retryErrors);
      running=(globalThis.navigator?.locks ? navigator.locks.request('konkari-observation-send',work) : work()).finally(()=>{running=null;});
      return running;
    },
    async remove(requestId) {
      if(running) await running;
      const work=async()=>{await store.remove(requestId);notify();};
      return globalThis.navigator?.locks ? navigator.locks.request('konkari-observation-send',work) : work();
    },
  };
}
export const outbox=createOutbox({store:deviceStore,fetcher:(...args)=>fetch(...args),notify:detail=>{
  window.dispatchEvent(new CustomEvent('konkari-outbox',{detail}));
}});
export async function saveObservation(input) {
  const entry=await outbox.save(input);
  // Local persistence is the success boundary; background errors never clear a form without saving it.
  void outbox.flush(input.accountId).catch(()=>{});
  return entry;
}
