import { useEffect, useState } from 'react';
import { accountRequest } from './Account';

async function thumbnail(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw Error('Valitse JPG-, PNG- tai WebP-kuva, enintään 8 Mt.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 192;
    const ctx = canvas.getContext('2d'), side = Math.min(bitmap.width, bitmap.height);
    ctx.fillStyle = '#F5F5DC'; ctx.fillRect(0,0,192,192);
    ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,192,192);
    return canvas.toDataURL('image/jpeg',0.8);
  } finally { bitmap.close(); }
}
const emptyEntry = () => ({title:'',place:'',visitedOn:new Date().toLocaleDateString('sv-SE'),body:'',animal:''});
export default function PersonalSpace({ name }) {
  const [profile,setProfile] = useState(null), [entries,setEntries] = useState([]);
  const [error,setError] = useState(''), [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false), [retry,setRetry] = useState(0);
  const [draft,setDraft] = useState(null), [editing,setEditing] = useState(null);
  const [removing,setRemoving] = useState(null);
  const [profileDraft,setProfileDraft] = useState(null);
  const [sharing,setSharing] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all([accountRequest('/account/profile'),accountRequest('/account/journal')]).then(([p,j]) => {
      if(live) { setProfile(p); setEntries(j); }
    }).catch(e => { if(live) setError(e.message); });
    return () => { live = false; };
  },[retry]);
  async function run(action) {
    if(busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="personal-space">
    {error && <p role="alert">{error} {!profile && <button onClick={() => {setError('');setRetry(n=>n+1);}}>Yritä uudelleen</button>}</p>}
    {notice && <p role="status">{notice}</p>}
    {!profile ? <p>Ladataan profiilia ja retkipäiväkirjaa…</p> : <>
      <section className="account-section profile-card" aria-label="Oma profiili">
        <div className="profile-overview">
          <div className="avatar-preview">{profile.avatar ? <img src={profile.avatar} alt={`${name}: profiilikuva`} width="96" height="96" /> : <span aria-label="Oletusavatar">{name.slice(0,1).toUpperCase()}</span>}</div>
          <div className="profile-introduction"><p className="eyebrow">OMA RETKEILIJÄPROFIILI</p><h2>{name}</h2>
            <p className="profile-bio">{profile.bio || 'Oma paikka retkimuistoille ja tuleville seikkailuille.'}</p>
            <p className="source-note">Profiili näkyy toistaiseksi vain sinulle.</p>
          </div>
          <button className="secondary" disabled={busy} aria-expanded={!!profileDraft} aria-controls="profile-edit-form" onClick={()=>{setProfileDraft({...profile});setNotice('');setError('');}}>Muokkaa profiilia</button>
        </div>
        {profileDraft && <form id="profile-edit-form" className="report-form profile-editor" onSubmit={e => {e.preventDefault();run(async () => {
          const saved=await accountRequest('/account/profile',{method:'PUT',body:JSON.stringify(profileDraft)});
          setProfile(saved);setProfileDraft(null);setNotice('Profiili tallennettu.');
        });}}>
          <h3>Muokkaa profiilia</h3>
          <div className="avatar-preview">{profileDraft.avatar ? <img src={profileDraft.avatar} alt="Uuden profiilikuvan esikatselu" width="96" height="96" /> : <span aria-label="Oletusavatar">{name.slice(0,1).toUpperCase()}</span>}</div>
          <label htmlFor="avatar-file">Profiilikuva (JPG, PNG tai WebP, enintään 8 Mt)</label>
          <input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => {const file=e.target.files?.[0];e.target.value='';if(file)run(async () => {const avatar=await thumbnail(file);setProfileDraft(p=>({...p,avatar}));});}} />
          <p>Kuva rajataan keskeltä neliöksi.</p>
          {profileDraft.avatar && <button className="secondary" type="button" disabled={busy} onClick={()=>setProfileDraft(p=>({...p,avatar:''}))}>Poista kuva</button>}
          <label htmlFor="profile-bio">Lyhyesti minusta ({profileDraft.bio.length}/500)</label>
          <textarea id="profile-bio" maxLength={500} value={profileDraft.bio} disabled={busy} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))} placeholder="Millainen retkeilijä olet?" />
          <div className="journal-actions"><button className="primary" disabled={busy}>{busy ? 'Odota…' : 'Tallenna profiili'}</button>
          <button className="secondary" type="button" disabled={busy} onClick={()=>{setProfileDraft(null);setError('');}}>Peruuta</button></div>
        </form>}
      </section>
      <section className="account-section journal"><div className="list-heading"><h2>Oma retkipäiväkirja</h2>
        {!draft && <button className="primary" disabled={busy} onClick={()=>{setDraft(emptyEntry());setEditing(null);setNotice('');}}>Lisää retkimerkintä</button>}</div>
        <p>Uudet merkinnät näkyvät vain sinulle. Voit jakaa valitsemasi merkinnän kavereille tai kaikille retkikuulumisiin.</p>
        <a href="#/community">Katso retkikuulumiset ja eläinhavainnot →</a>
        {draft && <form className="report-form" onSubmit={e=>{e.preventDefault();run(async()=>{
          const saved=await accountRequest(editing ? `/account/journal/${editing}` : '/account/journal',{method:editing ? 'PUT':'POST',body:JSON.stringify(draft)});
          setEntries(items=>[...items.filter(i=>i.id!==saved.id),saved].sort((a,b)=>b.visitedOn.localeCompare(a.visitedOn)||b.id-a.id));setDraft(null);setEditing(null);setNotice('Retkimerkintä tallennettu.');
        });}}>
          <h3>{editing ? 'Muokkaa retkimerkintää':'Uusi retkimerkintä'}</h3>
          {editing && entries.find(i=>i.id===editing)?.visibility!=='private' && <p>Tämä merkintä on jaettu. Tallentamasi muutokset näkyvät myös sen lukijoille.</p>}
          <label htmlFor="journal-title">Otsikko</label><input id="journal-title" required maxLength={120} disabled={busy} value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}/>
          <label htmlFor="journal-date">Retkipäivä</label><input id="journal-date" type="date" required disabled={busy} value={draft.visitedOn} onChange={e=>setDraft(d=>({...d,visitedOn:e.target.value}))}/>
          <label htmlFor="journal-place">Paikka tai reitti (vapaaehtoinen)</label><input id="journal-place" maxLength={160} disabled={busy} value={draft.place} onChange={e=>setDraft(d=>({...d,place:e.target.value}))}/>
          <label htmlFor="journal-animal">Eläinhavainto: eläin tai laji (vapaaehtoinen)</label><input id="journal-animal" maxLength={120} disabled={busy} value={draft.animal} onChange={e=>setDraft(d=>({...d,animal:e.target.value}))} placeholder="Esimerkiksi hirvi tai kuukkeli"/>
          <label htmlFor="journal-body">Retken muistiinpanot</label><textarea id="journal-body" required maxLength={10000} disabled={busy} value={draft.body} onChange={e=>setDraft(d=>({...d,body:e.target.value}))}/>
          <button className="primary" disabled={busy}>Tallenna merkintä</button><button className="secondary" type="button" disabled={busy} onClick={()=>{setDraft(null);setEditing(null);}}>Peruuta</button>
        </form>}
        {!entries.length && <p>Päiväkirjasi on vielä tyhjä. Aloita vaikka viimeisimmästä lähiretkestä.</p>}
        <div className="journal-timeline">{entries.map(item=><article className="journal-entry" key={item.id}>
          <time dateTime={item.visitedOn}>{item.visitedOn.split('-').reverse().join('.')}</time><h3>{item.title}</h3><p className="source-note">{({private:'Vain minä',friends:'Kavereille',public:'Kaikille'})[item.visibility]}</p>{item.animal && <p className="type-tag">Eläinhavainto: {item.animal}</p>}{item.place && <p className="source-note">{item.place}</p>}<p className="journal-body">{item.body}</p>
          <div className="journal-actions"><button className="secondary" disabled={busy||!!draft} onClick={()=>{setEditing(item.id);setDraft({title:item.title,place:item.place,visitedOn:item.visitedOn,body:item.body,animal:item.animal});setRemoving(null);setSharing(null);}}>Muokkaa</button>
          <button className="secondary" disabled={busy||!!draft} onClick={()=>setSharing({id:item.id,visibility:item.visibility})}>Näkyvyys ja julkaisu</button>
          <button className="secondary" disabled={busy||!!draft} onClick={()=>setRemoving(item.id)}>Poista</button></div>
          {sharing?.id===item.id && <form className="report-form" onSubmit={e=>{e.preventDefault();run(async()=>{const result=await accountRequest(`/account/journal/${item.id}/visibility`,{method:'PUT',body:JSON.stringify({visibility:sharing.visibility})});setEntries(items=>items.map(i=>i.id===item.id?{...i,visibility:result.visibility}:i));setSharing(null);setNotice('Merkinnän näkyvyys päivitetty.');});}}>
            <label htmlFor={`visibility-${item.id}`}>Kuka näkee tämän merkinnän?</label><select id={`visibility-${item.id}`} disabled={busy} value={sharing.visibility} onChange={e=>setSharing(s=>({...s,visibility:e.target.value}))}><option value="private">Vain minä</option><option value="friends">Hyväksytyt Konkari-kaverit</option><option value="public">Kaikki, myös kirjautumatta</option></select>
            <p>Jakaminen näyttää koko merkinnän, paikan, eläinhavainnon ja nimimerkkisi valitsemallesi yleisölle. Voit palauttaa merkinnän yksityiseksi.</p>
            <button disabled={busy}>{sharing.visibility==='private'?'Pidä vain itselläni':'Julkaise valitulle yleisölle'}</button><button type="button" disabled={busy} onClick={()=>setSharing(null)}>Peruuta</button>
          </form>}
          {removing===item.id && <div><p>Poistetaanko tämä merkintä pysyvästi?</p><button disabled={busy} onClick={()=>run(async()=>{await accountRequest(`/account/journal/${item.id}`,{method:'DELETE'});setEntries(items=>items.filter(i=>i.id!==item.id));setRemoving(null);setNotice('Merkintä poistettu.');})}>Poista merkintä</button> <button disabled={busy} onClick={()=>setRemoving(null)}>Peruuta</button></div>}
        </article>)}</div>
      </section>
    </>}
  </div>;
}
