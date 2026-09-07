import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import './App.css';

const API = 'http://localhost:3000';
const typeNames = { lean_to: 'Laavu', fireplace: 'Tulentekopaikka', water: 'Vesipiste' };
const targetNames = { general: 'Kohde yleisesti', toilet: 'Käymälä', water: 'Vesipiste' };
const yesNo = value => value === true ? 'Kyllä' : value === false ? 'Ei' : 'Ei tietoa';
function MapFocus({ point }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.closePopup();
    map.stop();
    map.flyTo(point, 13);
  }, [map, point]);
  return null;
}

export default function App() {
  const [locations, setLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [focus, setFocus] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [gpsMessage, setGpsMessage] = useState('');
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(['locations', 'reports'].map(async endpoint => {
      const response = await fetch(`${API}/${endpoint}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Tietojen lataus epäonnistui.');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Palvelimen vastaus ei ollut odotettu.');
      return data;
    })).then(([places, observations]) => { setLocations(places); setReports(observations); })
      .catch(error => { if (error.name !== 'AbortError') setLoadError('Tietoja ei saatu. Tarkista backend ja lataa sivu uudelleen.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const selected = locations.find(location => location.id === selectedId);
  const draft = drafts[selectedId] || { comment: '', status: 'ok', target: 'general' };
  const updateDraft = change => setDrafts(previous => ({ ...previous, [selectedId]: { ...draft, ...change } }));
  const visible = locations.filter(location => location.name.toLocaleLowerCase('fi').includes(search.toLocaleLowerCase('fi')));
  const hasPoint = location => Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
  const select = location => {
    setSelectedId(location.id);
    setMessage(null);
    if (hasPoint(location)) setFocus([location.latitude, location.longitude]);
  };
  const locate = () => {
    if (!navigator.geolocation) { setGpsMessage('Selain ei tue paikannusta.'); return; }
    setGpsMessage('Paikannetaan…');
    navigator.geolocation.getCurrentPosition(position => {
      const point = [position.coords.latitude, position.coords.longitude];
      setUserLocation(point); setFocus(point); setGpsMessage('Sijaintisi näkyy sinisenä pisteenä.');
    }, () => setGpsMessage('Sijaintia ei saatu. Salli paikannus selaimessa tai valitse kohde kartalta.'), { timeout: 10000 });
  };
  const submit = async event => {
    event.preventDefault();
    if (!selected || saving) return;
    const id = selected.id;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(`${API}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: { id }, status: draft.status, target: draft.target, comment: draft.comment }) });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.message === 'string' ? result.message : 'Tallennus epäonnistui.');
      setReports(previous => [...previous, result]);
      setDrafts(previous => ({ ...previous, [id]: { comment: '', status: 'ok', target: 'general' } }));
      setMessage({ id, text: 'Kiitos! Raporttisi on tallennettu.', error: false });
    } catch (error) { setMessage({ id, text: error instanceof TypeError ? 'Yhteys katkesi. Tekstisi säilyi — yritä uudelleen.' : error.message, error: true }); }
    finally { setSaving(false); }
  };

  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#">⌁ <span>Retkiraportit</span></a><span className="header-note">Luonnossa, yhdessä.</span></header>
    <main>
      <section className="intro"><p className="eyebrow">PIENI HAVAINTO, ISO APU</p><h1>Hyvä retki alkaa<br />yhteisestä tiedosta.</h1><p>Löydä taukopaikka ja jaa havaintosi seuraavalle retkeilijälle.</p></section>
      {loadError && <p className="error-banner" role="alert">{loadError}</p>}
      <div className="explorer">
        <section className="map-panel" aria-label="Retkikohteiden kartta">
          <div className="map-toolbar"><span>{loading ? 'Ladataan kohteita…' : `${locations.length} retkikohdetta`}</span><button className="secondary" onClick={locate}>◎ Paikanna minut</button></div>
          <MapContainer center={[60.32,24.51]} zoom={11} className="map">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFocus point={focus} />
            {visible.filter(hasPoint).map(location => <CircleMarker key={location.id} center={[location.latitude,location.longitude]} radius={selectedId === location.id ? 12 : 9} pathOptions={{ color: '#fff', weight: 3, fillColor: selectedId === location.id ? '#173e2f' : '#3D9970', fillOpacity: 1 }} eventHandlers={{ click: () => select(location) }}><Popup autoPan={false}>{location.name}</Popup></CircleMarker>)}
            {userLocation && <CircleMarker center={userLocation} radius={7} pathOptions={{ color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }}><Popup autoPan={false}>Sinä olet täällä</Popup></CircleMarker>}
          </MapContainer>
          <p className="map-note" role="status">{gpsMessage || 'Valitse piste kartalta tai kohde alla olevasta luettelosta.'}</p>
        </section>
        <aside className="place-card" aria-label="Valitun kohteen tiedot">
          {!selected ? <div className="empty-card"><span className="empty-icon">⌁</span><p className="eyebrow">LÖYDÄ OMA TAUKOPAIKKASI</p><h2>Mihin tänään?</h2><p>Valitse kohde kartalta. Näet sen palvelut ja retkeilijöiden havainnot täällä.</p></div> : <>
            <div className="card-heading"><span className="type-tag">{typeNames[selected.type] || 'Retkikohde'}</span><button className="close-button" aria-label="Sulje kohdekortti" onClick={() => setSelectedId(null)}>×</button></div>
            <h2>{selected.name}</h2>{selected.description && <p className="description">{selected.description}</p>}
            <h3>Paikan palvelut</h3>
            <dl className="services"><div><dt>Käymälä</dt><dd>{yesNo(selected.services?.toilet)}</dd></div><div><dt>Vesipiste</dt><dd>{({ 'year-round': 'Ympärivuotinen', seasonal: 'Kausittainen' })[selected.services?.waterPoint] || 'Ei tietoa'}</dd></div><div><dt>Vapaa käyttö</dt><dd>{yesNo(selected.services?.freeUse)}</dd></div></dl>
            <p className="source-note">{selected.source ? <>Perustiedot: <a href={selected.source.url} target="_blank" rel="noreferrer">{selected.source.name}</a>.</> : 'Palvelutietojen lähdettä ei ole saatavilla.'} Ei tietoa tarkoittaa, ettei palvelusta ole vahvistettua tietoa.</p>
            <p className="source-note">Vesipisteen kausikäyttö ei kerro veden juomakelpoisuudesta tai tämänhetkisestä toimivuudesta.</p>
            <form onSubmit={submit} className="report-form"><h3>Jätä retkiraportti</h3><p>Valitse, mitä havaintosi koskee. Eri palveluista voit jättää erilliset raportit.</p>
              <fieldset className="report-targets" disabled={saving}><legend>Mitä arvioit?</legend>
                {['general', ...(selected.services?.toilet === true ? ['toilet'] : []), ...(['year-round', 'seasonal'].includes(selected.services?.waterPoint) ? ['water'] : [])].map(target =>
                  <label key={target}><input type="radio" name="report-target" value={target} checked={draft.target === target} onChange={() => updateDraft({ target, status: 'ok' })} />{targetNames[target]}</label>)}
              </fieldset>
              <label htmlFor="condition">{draft.target === 'water' ? 'Vesipisteen toimivuus' : draft.target === 'toilet' ? 'Käymälän kunto' : 'Kohteen yleiskunto'}</label><select id="condition" value={draft.status} disabled={saving} onChange={e => updateDraft({ status: e.target.value })}><option value="ok">{draft.target === 'water' ? 'Toimii' : 'Kunnossa'}</option><option value="not_ok">{draft.target === 'water' ? 'Ei toimi' : 'Ei kunnossa'}</option></select><label htmlFor="comment">Havaintosi</label><textarea id="comment" placeholder={draft.target === 'toilet' ? 'Esimerkiksi: käymälä on siisti, mutta paperi on loppu.' : draft.target === 'water' ? 'Esimerkiksi: hanasta ei tule vettä.' : 'Esimerkiksi: laavun katto vuotaa.'} maxLength={2000} value={draft.comment} disabled={saving} onChange={e => updateDraft({ comment: e.target.value })} /><button className="primary" disabled={saving}>{saving ? 'Tallennetaan…' : 'Jaa havainto'}</button>{message?.id === selectedId && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}</form>
            <section className="observations"><h3>Retkeilijöiden havainnot</h3>{reports.filter(r => r.location?.id === selectedId).length === 0 ? <p>Ei vielä raportteja. Kerro ensimmäinen havainto.</p> : reports.filter(r => r.location?.id === selectedId).slice().reverse().map(report => <article className="observation" key={report.id}><strong className="observation-target">{targetNames[report.target] || targetNames.general}</strong><span className={report.status === 'ok' ? 'good' : 'attention'}>{report.target === 'water' ? (report.status === 'ok' ? '✓ Toimii' : '! Ei toimi') : (report.status === 'ok' ? '✓ Kunnossa' : '! Ei kunnossa')}</span>{report.comment && <p>{report.comment}</p>}</article>)}</section>
          </>}
        </aside>
      </div>
      <section className="place-list"><div className="list-heading"><div><p className="eyebrow">SEURAAVA PYSÄHDYS</p><h2>Tutustu kohteisiin</h2></div><label className="search">Hae nimellä<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Etsi taukopaikka…" /></label></div><div className="place-grid">{visible.map(location => <button key={location.id} className={`place-option ${location.id === selectedId ? 'chosen' : ''}`} aria-pressed={location.id === selectedId} onClick={() => select(location)}><span className="eyebrow">{typeNames[location.type] || 'Retkikohde'}</span><strong>{location.name}</strong><span>{hasPoint(location) ? 'Näytä kohde ↗' : 'Sijainti puuttuu · Näytä tiedot'}</span></button>)}</div>{!loading && !visible.length && <p>Hakua vastaavia kohteita ei löytynyt.</p>}</section>
    </main><footer>Retkiraportit · Jätä jälkeesi hyödyllinen havainto.</footer>
  </div>;
}
