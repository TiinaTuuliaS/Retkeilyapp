import { useEffect, useState } from 'react';
import { accountRequest, useAccount } from './Account';

const day = value => value.split('-').reverse().join('.');
const tripDraft = () => ({title:'',destination:'',startsOn:new Date().toLocaleDateString('sv-SE'),endsOn:new Date().toLocaleDateString('sv-SE'),notes:''});

export function CommunityPage() {
  const {user,loading}=useAccount();
  const [items,setItems]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[animals,setAnimals]=useState(false);
  useEffect(()=>{
    if(loading) return;
    let live=true;setItems(null);setError('');
    accountRequest(user ? '/account/feed':'/community').then(data=>{if(live)setItems(data);}).catch(e=>{if(live)setError(e.message);});
    return ()=>{live=false;};
  },[user,loading,retry]);
  return <><header className="site-header"><a className="brand" href="#/">⌁ Konkari</a><a href="#/account">Oma sivu</a><a href="#/">Kartalle</a></header>
    <main className="account-page"><h1>Retkikuulumiset</h1><p>Retkeilijöiden julkaisemia retkimuistoja ja eläinhavaintoja. Havainnot ovat käyttäjien ilmoittamia.</p>
      <label><input type="checkbox" checked={animals} onChange={e=>setAnimals(e.target.checked)}/> Näytä vain eläinhavainnot</label>
      <p className="source-note">Näytetään 100 uusinta sinulle näkyvää julkaisua retkipäivän mukaan. {user ? 'Mukana ovat myös kavereiden sinulle jakamat merkinnät.':'Kirjaudu nähdäksesi kavereiden julkaisut.'}</p>
      {error ? <p role="alert">{error} <button onClick={()=>setRetry(n=>n+1)}>Yritä uudelleen</button></p> : !items ? <p>Ladataan…</p> : <div className="community-feed">
        {!items.filter(i=>!animals||i.animal).length && <p>Ei vielä julkaisuja tässä näkymässä.</p>}
        {items.filter(i=>!animals||i.animal).map(item=><article className="journal-entry" key={item.id}><p className="source-note">{item.author} · {day(item.visitedOn)} · {item.visibility==='friends'?'Kavereille':'Julkinen'}</p><h2>{item.title}</h2>{item.animal && <p className="type-tag">Eläinhavainto: {item.animal}</p>}<p>{item.place}</p><p className="journal-body">{item.body}</p></article>)}
      </div>}
    </main></>;
}

function TripCard({trip,friends,userId,busy,run,edit}) {
  const [notes,setNotes]=useState(null),[previousNotes,setPreviousNotes]=useState(''),[invite,setInvite]=useState(''),[deleting,setDeleting]=useState(false);
  const participating=trip.isOwner||trip.joined;
  return <article className="journal-entry"><p className="eyebrow">{trip.isOwner?'OMA RETKISUUNNITELMA':trip.joined?'MUKANA RETKELLÄ':'RETKIKUTSU'}</p><h3>{trip.title}</h3><p>{trip.destination} · {day(trip.startsOn)} – {day(trip.endsOn)}</p><p>Järjestäjä: {trip.organizer}</p>
    {!participating ? <div className="journal-actions"><button disabled={busy} onClick={()=>run(()=>accountRequest(`/account/trips/${trip.id}/join`,{method:'PUT'}))}>Hyväksy kutsu</button><button disabled={busy} onClick={()=>run(()=>accountRequest(`/account/trips/${trip.id}/members/${userId}`,{method:'DELETE'}))}>Hylkää kutsu</button></div> : <>
      <h4>Yhteiset muistiinpanot</h4><p className="journal-body">{trip.notes||'Ei vielä muistiinpanoja.'}</p>
      {notes===null ? <button className="secondary" disabled={busy} onClick={()=>{setNotes(trip.notes);setPreviousNotes(trip.notes);}}>Muokkaa muistiinpanoja</button> : <form className="report-form" onSubmit={e=>{e.preventDefault();run(async()=>{await accountRequest(`/account/trips/${trip.id}/notes`,{method:'PUT',body:JSON.stringify({notes,previousNotes})});setNotes(null);});}}><label htmlFor={`notes-${trip.id}`}>Retken yhteiset muistiinpanot</label><textarea id={`notes-${trip.id}`} value={notes} maxLength={10000} disabled={busy} onChange={e=>setNotes(e.target.value)}/><button disabled={busy}>Tallenna</button><button type="button" disabled={busy} onClick={()=>setNotes(null)}>Peruuta</button></form>}
      <h4>Retkiporukka</h4><p>{trip.organizer} (järjestäjä)</p><ul>{trip.members.map(m=><li key={m.id}>{m.name} · {m.accepted?'Mukana':'Kutsuttu'} {trip.isOwner && <button disabled={busy} onClick={()=>run(()=>accountRequest(`/account/trips/${trip.id}/members/${m.id}`,{method:'DELETE'}))}>Poista retkeltä</button>}</li>)}</ul>
      {trip.isOwner ? <><form className="inline-form" onSubmit={e=>{e.preventDefault();run(async()=>{await accountRequest(`/account/trips/${trip.id}/invites/${invite}`,{method:'POST'});setInvite('');});}}><label htmlFor={`invite-${trip.id}`}>Kutsu kaveri</label><select id={`invite-${trip.id}`} required value={invite} disabled={busy} onChange={e=>setInvite(e.target.value)}><option value="">Valitse kaveri</option>{friends.filter(f=>f.accepted&&!trip.members.some(m=>m.id===f.id)).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><button disabled={busy||!invite}>Lähetä retkikutsu</button></form>
        <div className="journal-actions"><button className="secondary" disabled={busy} onClick={()=>edit(trip)}>Muokkaa retken tietoja</button><button className="secondary" disabled={busy} onClick={()=>setDeleting(true)}>Poista retki</button></div>
        {deleting && <p>Poistetaanko suunnitelma kaikilta osallistujilta? <button disabled={busy} onClick={()=>run(()=>accountRequest(`/account/trips/${trip.id}`,{method:'DELETE'}))}>Poista suunnitelma</button> <button disabled={busy} onClick={()=>setDeleting(false)}>Peruuta</button></p>}
      </> : <button className="secondary" disabled={busy} onClick={()=>run(()=>accountRequest(`/account/trips/${trip.id}/members/${userId}`,{method:'DELETE'}))}>Poistu retkeltä</button>}
    </>}
  </article>;
}

export default function SocialSpace({userId}) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[code,setCode]=useState('');
  const [draft,setDraft]=useState(null),[editing,setEditing]=useState(null),[retry,setRetry]=useState(0);
  const [removeFriend,setRemoveFriend]=useState(null);
  async function load() {const [friends,trips]=await Promise.all([accountRequest('/account/friends'),accountRequest('/account/trips')]);return {friends,trips};}
  useEffect(()=>{let live=true;load().then(d=>{if(live)setData(d);}).catch(e=>{if(live)setError(e.message);});return ()=>{live=false;};},[retry]);
  async function run(action) {if(busy)return;setBusy(true);setError('');try{await action();setData(await load());}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <section className="account-section social-space"><h2>Konkari-kaverit ja yhteiset retket</h2><a href="#/community">Tutustu retkikuulumisiin ja eläinhavaintoihin →</a>
    {error && <p role="alert">{error} <button onClick={()=>{setError('');setRetry(n=>n+1);}}>Päivitä tiedot</button></p>}
    {!data ? <p>Ladataan kavereita ja retkiä…</p> : <>
      <div className="journal-entry"><h3>Konkari-kaverit</h3><p>Oma kaveritunnuksesi: <strong>{userId}</strong>. Anna tunnus kaverillesi, jotta hän voi lähettää pyynnön.</p>
        <form className="inline-form" onSubmit={e=>{e.preventDefault();run(async()=>{await accountRequest(`/account/friends/${code}`,{method:'POST'});setCode('');});}}><label htmlFor="friend-code">Kaverin tunnus</label><input id="friend-code" type="number" min="1" max="2147483647" required value={code} disabled={busy} onChange={e=>setCode(e.target.value)}/><button disabled={busy}>Lähetä kaveripyyntö</button></form>
        {!data.friends.length && <p>Ei vielä kavereita tai kaveripyyntöjä.</p>}
        <ul className="friend-list">{data.friends.map(f=><li key={f.id}><strong>{f.name}</strong> · {f.accepted?'Kaveri':f.incoming?'Saapunut kaveripyyntö':'Pyyntö lähetetty'} <div className="journal-actions">
          {!f.accepted&&f.incoming&&<button disabled={busy} onClick={()=>run(()=>accountRequest(`/account/friends/${f.id}`,{method:'PUT'}))}>Hyväksy</button>}
          <button disabled={busy} onClick={()=>setRemoveFriend(f.id)}>{f.accepted?'Poista kaveri':f.incoming?'Hylkää':'Peru pyyntö'}</button>
          {removeFriend===f.id && <span>Vahvistatko? <button disabled={busy} onClick={()=>run(async()=>{await accountRequest(`/account/friends/${f.id}`,{method:'DELETE'});setRemoveFriend(null);})}>Kyllä</button> <button onClick={()=>setRemoveFriend(null)}>Peruuta</button></span>}
        </div></li>)}</ul><p className="source-note">Kaveruuden poistaminen poistaa pääsyn kavereille jaettuihin merkintöihin. Retkiltä poistuminen tehdään erikseen.</p>
      </div>
      <div className="list-heading"><h3>Retkisuunnitelmat</h3>{!draft&&<button className="primary" disabled={busy} onClick={()=>{setDraft(tripDraft());setEditing(null);}}>Suunnittele retki</button>}</div><p>Suunnitelmat ovat retkiporukan omia. Kutsuttu näkee retken perustiedot; muistiinpanot avautuvat kutsun hyväksymisen jälkeen.</p>
      {draft && <form className="report-form" onSubmit={e=>{e.preventDefault();run(async()=>{await accountRequest(editing?`/account/trips/${editing}`:'/account/trips',{method:editing?'PUT':'POST',body:JSON.stringify(draft)});setDraft(null);setEditing(null);});}}><h4>{editing?'Muokkaa retkeä':'Uusi retkisuunnitelma'}</h4>
        {[['title','Retken nimi','text',120],['destination','Kohde tai reitti','text',200],['startsOn','Alkaa','date'],['endsOn','Päättyy','date']].map(([key,label,type,max])=><label key={key}>{label}<input required type={type} maxLength={max} min={key==='endsOn'?draft.startsOn:undefined} value={draft[key]} disabled={busy} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))}/></label>)}
        <label>Yhteiset muistiinpanot<textarea maxLength={10000} value={draft.notes} disabled={busy} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}/></label><p className="source-note">Sopikaa esimerkiksi varusteista, tapaamispaikasta ja kuljetuksista.</p><button disabled={busy}>Tallenna suunnitelma</button><button type="button" disabled={busy} onClick={()=>{setDraft(null);setEditing(null);}}>Peruuta</button>
      </form>}
      {!data.trips.length && <p>Ei vielä retkisuunnitelmia tai kutsuja.</p>}
      {data.trips.map(t=><TripCard key={t.id} trip={t} friends={data.friends} userId={userId} busy={busy||!!draft} run={run} edit={t=>{setEditing(t.id);setDraft({title:t.title,destination:t.destination,startsOn:t.startsOn,endsOn:t.endsOn,notes:t.notes,previousNotes:t.notes});}}/>)}
    </>}
  </section>;
}
