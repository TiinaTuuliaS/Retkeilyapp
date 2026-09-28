import { useEffect, useState } from 'react';
import { useAccount } from './Account';
import { saveObservation } from './observation-outbox';
import { offlineHelp } from './OfflineStatus';
const labels = { in_use: 'Kohde oli käytössä käynnilläni', not_in_use: 'Kohde ei ollut käytössä', unknown: 'Käyttötilaa ei voinut varmistaa' };
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
export default function UsageObservations({ locationId, locationName, api }) {
  const { user } = useAccount();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ status: 'unknown', comment: '', observedOn: today() });
  const [reload, setReload] = useState(0);
  const url = `${api}/locations/${locationId}/usage-observations`;
  useEffect(()=>{
    const delivered=({detail})=>{if(detail?.kind==='usage'&&detail.locationId===locationId){setReload(n=>n+1);setError('');}};
    window.addEventListener('konkari-outbox',delivered);
    return ()=>window.removeEventListener('konkari-outbox',delivered);
  },[locationId]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(async r => {
      if (!r.ok) throw Error('Käyttötilahavaintoja ei saatu ladattua.');
      const data = await r.json();
      if (!Array.isArray(data)) throw Error('Virheellinen vastaus.');
      setItems(data); setLoaded(true);
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [url, reload]);
  async function submit(e) {
    e.preventDefault(); if (saving) return;
    setSaving(true); setMessage('');
    try {
      await saveObservation({accountId:user?.id,kind:'usage',locationId,locationName,data:draft});
      setOpen(false); setDraft({ status: 'unknown', comment: '', observedOn: today() });
      setMessage('Havainto on tallessa tällä laitteella. Seuraa lähetystä sivun yläreunan lähetysjonosta.');
    } catch (e) { setMessage(e instanceof TypeError ? 'Tallennus tälle laitteelle ei onnistunut. Tekstisi säilyi lomakkeella.' : e.message); }
    finally { setSaving(false); }
  }
  return <section className="observations">
    <h3>Havainnot käyttötilasta</h3>
    <p className="source-note">Käyttäjähavainto ei vahvista kohteen avaamista eikä kumoa käyttörajoituksia. Noudata kohteen opasteita ja ylläpitäjän ohjeita.</p>
    {error ? <p role="alert">{error} <button type="button" onClick={() => { setError(''); setReload(n => n+1); }}>Yritä uudelleen</button></p> : !loaded ? <p>Ladataan…</p> : <>
      {!items.length && <p>Ei vielä päivättyjä käyttötilahavaintoja.</p>}
      {items.map(item => <article className="observation" key={item.id}><strong>{labels[item.status]}</strong><p><time dateTime={item.observedOn}>{item.observedOn.split('-').reverse().join('.')}</time> · Käyttäjähavainto</p><p>{item.comment}</p></article>)}
    </>}
      {!user && <p><a href="#/account">Kirjaudu</a> lisätäksesi käyttötilahavainnon.</p>}
      <button className="secondary" type="button" disabled={saving || !user} aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? 'Sulje lomake' : 'Kerro havainto käyttötilasta'}</button>
      {open && user && <form className="report-form" onSubmit={submit}>
        <p>{offlineHelp}</p>
        <label htmlFor="usage-status">Mitä havaitsit?</label><select id="usage-status" disabled={saving} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>{Object.entries(labels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
        <label htmlFor="usage-date">Käyntipäivä</label><input id="usage-date" type="date" required min="2000-01-01" max={today()} disabled={saving} value={draft.observedOn} onChange={e => setDraft({ ...draft, observedOn: e.target.value })} />
        <label htmlFor="usage-comment">Kuvaile havaintosi</label><textarea id="usage-comment" required maxLength={1000} disabled={saving} value={draft.comment} onChange={e => setDraft({ ...draft, comment: e.target.value })} />
        <button className="primary" disabled={saving}>{saving ? 'Tallennetaan…' : 'Tallenna käyttötilahavainto'}</button>
      </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
