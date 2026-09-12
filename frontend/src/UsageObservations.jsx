import { useEffect, useState } from 'react';
const labels = { in_use: 'Kohde oli käytössä käynnilläni', not_in_use: 'Kohde ei ollut käytössä', unknown: 'Käyttötilaa ei voinut varmistaa' };
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
export default function UsageObservations({ locationId, api }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ status: 'unknown', comment: '', observedOn: today() });
  const [reload, setReload] = useState(0);
  const url = `${api}/locations/${locationId}/usage-observations`;
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
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await r.json();
      if (!r.ok) throw Error(typeof data.message === 'string' ? data.message : 'Tallennus epäonnistui.');
      setItems(previous => [...previous, data].sort((a,b) => b.observedOn.localeCompare(a.observedOn) || b.id-a.id));
      setOpen(false); setDraft({ status: 'unknown', comment: '', observedOn: today() });
      setMessage('Havainto tallennettu. Lähteen käyttötilamerkintä säilyy ennallaan.');
    } catch (e) { setMessage(e instanceof TypeError ? 'Yhteys katkesi. Tekstisi säilyi. Tarkista havainnot ennen uutta lähetystä.' : e.message); }
    finally { setSaving(false); }
  }
  return <section className="observations">
    <h3>Havainnot käyttötilasta</h3>
    <p className="source-note">Käyttäjähavainto ei vahvista kohteen avaamista eikä kumoa käyttörajoituksia. Noudata kohteen opasteita ja ylläpitäjän ohjeita.</p>
    {error ? <p role="alert">{error} <button type="button" onClick={() => { setError(''); setReload(n => n+1); }}>Yritä uudelleen</button></p> : !loaded ? <p>Ladataan…</p> : <>
      {!items.length && <p>Ei vielä päivättyjä käyttötilahavaintoja.</p>}
      {items.map(item => <article className="observation" key={item.id}><strong>{labels[item.status]}</strong><p><time dateTime={item.observedOn}>{item.observedOn.split('-').reverse().join('.')}</time> · Käyttäjähavainto</p><p>{item.comment}</p></article>)}
      <button className="secondary" type="button" disabled={saving} aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? 'Sulje lomake' : 'Kerro havainto käyttötilasta'}</button>
      {open && <form className="report-form" onSubmit={submit}>
        <label htmlFor="usage-status">Mitä havaitsit?</label><select id="usage-status" disabled={saving} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>{Object.entries(labels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
        <label htmlFor="usage-date">Käyntipäivä</label><input id="usage-date" type="date" required min="2000-01-01" max={today()} disabled={saving} value={draft.observedOn} onChange={e => setDraft({ ...draft, observedOn: e.target.value })} />
        <label htmlFor="usage-comment">Kuvaile havaintosi</label><textarea id="usage-comment" required maxLength={1000} disabled={saving} value={draft.comment} onChange={e => setDraft({ ...draft, comment: e.target.value })} />
        <button className="primary" disabled={saving}>{saving ? 'Tallennetaan…' : 'Tallenna käyttötilahavainto'}</button>
      </form>}
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
