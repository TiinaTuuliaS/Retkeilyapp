import { useEffect, useState } from 'react';

const kinds = { tap: 'Hana', well: 'Kaivo', spring: 'Lähde', other: 'Muu vesipiste' };
const availabilityNames = { available: 'Vettä oli saatavilla', unavailable: 'Vettä ei ollut saatavilla', unknown: 'Saatavuutta ei tarkistettu' };
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
const emptyDraft = () => ({ kind: '', directions: '', availability: 'unknown', observedOn: today() });

export default function WaterObservations({ locationId, api, knownWell = false }) {
  const [observations, setObservations] = useState([]);
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(), kind: knownWell ? 'well' : '' }));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const url = `${api}/locations/${locationId}/water-observations`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Vesipistehavaintojen lataus epäonnistui.');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Virheellinen vastaus.');
      setObservations(data);
    }).catch(error => {
      if (error.name !== 'AbortError') setLoadError('Vesipistehavaintoja ei saatu ladattua.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [url, reload]);

  const update = change => setDraft(previous => ({ ...previous, ...change }));
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.message === 'string' ? result.message : 'Tallennus epäonnistui.');
      setObservations(previous => [...previous, result].sort((a,b) => b.observedOn.localeCompare(a.observedOn) || b.createdAt.localeCompare(a.createdAt) || b.id-a.id));
      setDraft({ ...emptyDraft(), kind: knownWell ? 'well' : '' }); setOpen(false);
      setMessage({ error: false, text: 'Kiitos! Vesipistehavaintosi tallennettiin.' });
    } catch (error) {
      setMessage({ error: true, text: error instanceof TypeError ? 'Yhteys katkesi. Tietosi säilyivät lomakkeella. Tarkista havainnot ennen uutta lähetystä.' : error.message });
    } finally { setSaving(false); }
  }

  return <section className="water-observations" aria-label="Käyttäjien vesipistehavainnot">
    <h3>{knownWell ? 'Kaivon veden saatavuus' : 'Retkeilijöiden vesipistetiedot'}</h3>
    <p className="source-note">Käyttäjien ilmoittamia, vahvistamattomia havaintoja. Veden saatavuus voi muuttua. Havainnot eivät vahvista veden juomakelpoisuutta.</p>
    {loading ? <p role="status">Ladataan havaintoja…</p> : loadError ? <div role="alert"><p>{loadError}</p><button type="button" className="secondary" onClick={() => { setLoadError(''); setLoading(true); setReload(n => n+1); }}>Yritä uudelleen</button></div> : <>
      {!observations.length && <p className="source-note">{knownWell ? 'Ei vielä havaintoja veden saatavuudesta tässä kaivossa.' : 'Ei vielä käyttäjien vesipistehavaintoja tästä kohteesta.'}</p>}
      {observations.map(item => <article key={item.id} className="observation water-observation">
        <span className="type-tag">{knownWell ? 'Käyttäjän havainto kaivosta' : 'Käyttäjän ilmoittama vesipiste'}</span>
        <h4>{kinds[item.kind]}</h4>
        <p><time dateTime={item.observedOn}>{item.observedOn.split('-').reverse().join('.')}</time> · {availabilityNames[item.availability]}</p>
        <p>{item.directions}</p>
      </article>)}
      <button type="button" className="secondary" aria-expanded={open} aria-controls="water-form" onClick={() => setOpen(value => !value)} disabled={saving}>
        {open ? 'Sulje vesipistelomake' : knownWell ? 'Kerro kaivon veden saatavuudesta' : observations.length ? 'Lisää vesipistehavainto' : 'Ilmoita vesipisteestä'}
      </button>
      {open && <form id="water-form" className="report-form" onSubmit={submit}>
        <h4>{knownWell ? 'Havainto tästä kaivosta' : 'Vesipiste tämän taukopaikan yhteydessä'}</h4>
        <label htmlFor="water-kind">Vesipisteen tyyppi</label>
        <select id="water-kind" required value={draft.kind} disabled={saving || knownWell} onChange={e => update({ kind: e.target.value })}>
          <option value="">Valitse tyyppi</option>{Object.entries(kinds).map(([key,name]) => <option key={key} value={key}>{name}</option>)}
        </select>
        <label htmlFor="water-directions">{knownWell ? 'Lisätiedot havainnosta' : 'Missä vesipiste sijaitsee?'}</label>
        <textarea id="water-directions" required maxLength={1000} value={draft.directions} disabled={saving} onChange={e => update({ directions: e.target.value })} placeholder={knownWell ? "Esimerkiksi: pumpusta ei tullut vettä käynnilläni." : "Esimerkiksi: kaivo noin 50 metriä laavulta, käymälälle johtavan polun vieressä."} />
        <label htmlFor="water-date">Käyntipäivä</label>
        <input id="water-date" type="date" min="2000-01-01" max={today()} required value={draft.observedOn} disabled={saving} onChange={e => update({ observedOn: e.target.value })} />
        <label htmlFor="water-availability">Veden saatavuus käyntipäivänä</label>
        <select id="water-availability" value={draft.availability} disabled={saving} onChange={e => update({ availability: e.target.value })}>
          {Object.entries(availabilityNames).map(([key,name]) => <option key={key} value={key}>{name}</option>)}
        </select>
        <button type="submit" className="primary" disabled={saving}>{saving ? 'Tallennetaan…' : 'Tallenna vesipistehavainto'}</button>
      </form>}
    </>}
    {message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
  </section>;
}
