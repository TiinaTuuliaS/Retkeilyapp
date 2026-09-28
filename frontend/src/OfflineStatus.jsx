import {useEffect,useState} from 'react';
import {useAccount} from './Account';
import {deviceStore,outbox} from './observation-outbox';

export const offlineHelp='Voit tallentaa havainnon myös ilman verkkoa. Se jää tämän laitteen lähetysjonoon ja lähetetään yhteyden palattua, kun Konkari on auki.';
const states={pending:'Odottaa lähetystä',sent:'Lähetetty',auth:'Kirjautuminen tarvitaan',error:'Lähetys epäonnistui'};
const kinds={report:'Kuntohavainto',water:'Vesihavainto',usage:'Käyttötilahavainto'};
const values={ok:'Kunnossa',not_ok:'Ei kunnossa',general:'Kohde yleisesti',toilet:'Käymälä',water:'Vesipiste',tap:'Hana',well:'Kaivo',spring:'Lähde',other:'Muu vesipiste',available:'Vettä saatavilla',unavailable:'Vettä ei saatavilla',unknown:'Ei varmistettu',in_use:'Käytössä',not_in_use:'Ei käytössä'};
export default function OfflineStatus() {
  const {user}=useAccount();
  const [items,setItems]=useState([]),[online,setOnline]=useState(navigator.onLine),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [confirm,setConfirm]=useState(null);
  useEffect(()=>{
    let live=true;
    const refresh=()=>deviceStore.all().then(rows=>{if(live)setItems(rows.filter(x=>x.accountId===user?.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));}).catch(e=>{if(live)setError(e.message);});
    const send=()=>{if(user)void outbox.flush(user.id).catch(e=>{if(live)setError(e.message);});};
    const network=()=>{setOnline(navigator.onLine);send();};
    refresh();send();
    window.addEventListener('konkari-outbox',refresh);window.addEventListener('online',network);window.addEventListener('offline',network);window.addEventListener('focus',send);
    const timer=setInterval(()=>{refresh();send();},30000);
    return ()=>{live=false;clearInterval(timer);window.removeEventListener('konkari-outbox',refresh);window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('focus',send);};
  },[user]);
  if(!user) return null;
  const own=items.filter(i=>i.accountId===user.id),pending=own.filter(i=>i.state!=='sent');
  return <aside className="offline-status" aria-label="Offline-havainnot">
    <details><summary><span aria-live="polite">{online?'Havainnot kulkevat mukana myös katveessa':'Ei verkkoyhteyttä – voit tallentaa havaintoja'}{pending.length?` · ${pending.length} lähetysjonossa`:own.length?' · Havainnot lähetetty':''}</span></summary>
      <p>{offlineHelp}</p><p className="source-note">Kirjaudu ja avaa tarvitsemasi kohteet ennen retkeä. Tämä ensimmäinen versio toimii jo avatulla kohdesivulla; sovelluksen avaamista uudelleen ilman verkkoa tai offline-karttoja ei vielä tueta. Selaimen tietojen tyhjentäminen poistaa lähettämättömät havainnot. Yhteiskäyttöisellä laitteella myös jonon tekstit jäävät laitteen tallennustilaan.</p>
      <button type="button" className="secondary" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await outbox.flush(user.id,true);}catch(e){setError(e.message);}finally{setBusy(false);}}}>{busy?'Yritetään lähettää…':'Yritä lähetystä nyt'}</button>
      {error&&<p role="alert">{error}</p>}
      {!own.length&&<p>Ei laitteelle tallennettuja havaintoja.</p>}
      {own.map(item=><article className="observation" key={item.requestId}><strong>{item.locationName || `Kohde ${item.locationId}`} · {kinds[item.kind]}</strong><p>{states[item.state]} · {new Date(item.createdAt).toLocaleString('fi-FI')}</p>{item.state!=='sent'&&<p>{item.message}</p>}{item.state==='auth'&&<a href="#/account">Avaa kirjautuminen</a>}
        <details><summary>Näytä tallennettu havainto</summary><p>{values[item.data.target]||values[item.data.kind]} · {values[item.data.status]||values[item.data.availability]}</p>{item.data.observedOn&&<p>Käyntipäivä {item.data.observedOn.split('-').reverse().join('.')}</p>}<p className="queued-content">{item.data.comment||item.data.directions||'Ei lisätietoja.'}</p></details>
        <button type="button" className="secondary" onClick={()=>setConfirm(item.requestId)}>{item.state==='sent'?'Poista kuittaus tältä laitteelta':'Poista jonosta'}</button>
        {confirm===item.requestId&&<p>Poistetaanko paikallinen kopio? Jo palvelimelle saapunutta havaintoa ei poisteta. <button disabled={busy} onClick={async()=>{setBusy(true);try{await outbox.remove(item.requestId);setConfirm(null);window.dispatchEvent(new Event('konkari-outbox'));}catch(e){setError(e.message);}finally{setBusy(false);}}}>Poista</button> <button onClick={()=>setConfirm(null)}>Peruuta</button></p>}
      </article>)}
    </details>
  </aside>;
}
