import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet';
import './App.css';
import WaterObservations from './WaterObservations';
import UsageObservations from './UsageObservations';
import { geoJSON } from 'leaflet';
import { filterLocations, hasPoint } from './location-list';

const API = 'http://localhost:3000';
const typeNames = { weather_shelter: 'Sääsuoja', lean_to: 'Laavu', shelter: 'Laavu, kota tai kammi', fireplace: 'Tulentekopaikka', water: 'Vesipiste', rest_area: 'Taukopaikka', campsite: 'Telttailupaikka' };
const targetNames = { general: 'Kohde yleisesti', toilet: 'Käymälä', water: 'Vesipiste' };
const yesNo = value => value === true ? 'Kyllä' : value === false ? 'Ei' : 'Ei tietoa';
function MapFocus({ point, boundary }) {
  const map = useMap();
  useEffect(() => {
    if (!point) {
      if (boundary) map.fitBounds(geoJSON(boundary).getBounds(), { padding: [20, 20], maxZoom: 12 });
      return;
    }
    map.closePopup();
    map.stop();
    map.flyTo(point, 13);
  }, [map, point, boundary]);
  return null;
}

function MapArea({ onChange }) {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      const bounds = map.getBounds();
      onChange({ south: bounds.getSouth(), north: bounds.getNorth(), west: bounds.getWest(), east: bounds.getEast() });
    };
    map.whenReady(update);
    map.on('moveend resize', update);
    return () => { map.off('load', update); map.off('moveend resize', update); };
  }, [map, onChange]);
  return null;
}

export default function App({ park = null, parks = [] }) {
  const [locations, setLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [focus, setFocus] = useState(null);
  const [search, setSearch] = useState('');
  const [bounds, setBounds] = useState(null);
  const [shownCount, setShownCount] = useState(6);
  const updateArea = useCallback(area => { setBounds(area); setShownCount(6); }, []);
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
  }, [park]);

  const selected = locations.find(location => location.id === selectedId);
  const draft = drafts[selectedId] || { comment: '', status: 'ok', target: 'general' };
  const updateDraft = change => setDrafts(previous => ({ ...previous, [selectedId]: { ...draft, ...change } }));
  const searching = search.trim().length > 0;
  const scopedLocations = park ? locations.filter(location => park.locationIds.includes(location.id)) : locations;
  const visible = filterLocations(locations, scopedLocations, search, bounds);
  const markers = searching ? visible : scopedLocations;
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
    <header className="site-header"><a className="brand" href="#/">⌁ <span>Konkari</span></a><nav className="park-nav" aria-label="Päänavigaatio"><a href="#/">Kaikki kohteet</a>{parks.map(p => <a key={p.slug} href={`#/parks/${p.slug}`} aria-current={park?.slug === p.slug ? 'page' : undefined}>{p.slug === 'ukk' ? 'UKK' : p.name.replace(' kansallispuisto', '')}</a>)}</nav></header>
    <main>
      {park ? <section className="intro park-intro">
        <a href="#/">← Kaikki retkikohteet</a><p className="eyebrow">KANSALLISPUISTO · {park.region}</p>
        <h1>{park.name}</h1><p className="park-description">{park.description}</p>
        <p className="source-note">Oma tiivistelmä · <a href={park.descriptionSource} target="_blank" rel="noreferrer">Lähde: Metsähallitus</a></p>
        <a className="official-link" href={park.officialUrl} target="_blank" rel="noreferrer">Ajankohtaiset tiedot ja ohjeet Luontoon.fi:ssä ↗</a>
        <p className="coverage-note">{park.coverage}</p>
      </section> : <><section className="intro"><p className="eyebrow">PIENI HAVAINTO, ISO APU</p><h1>Hyvä retki alkaa<br />yhteisestä tiedosta.</h1><p>Löydä taukopaikka ja jaa havaintosi seuraavalle retkeilijälle.</p></section>
</>}

      {loadError && <p className="error-banner" role="alert">{loadError}</p>}
      <div className="explorer">
        <section className="map-panel" aria-label="Retkikohteiden kartta">
          <div className="map-toolbar"><span>{loading ? 'Ladataan kohteita…' : `${visible.length} ${searching ? 'hakutulosta' : 'kohdetta kartan alueella'}`}</span><button className="secondary" onClick={locate}>◎ Paikanna minut</button></div>
          <MapContainer center={[60.32,24.51]} zoom={11} className="map">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapArea onChange={updateArea} />
            <MapFocus point={focus} boundary={park?.geometry} />
            {park && <GeoJSON data={park.geometry} interactive={false} style={{ color: '#246746', weight: 2, fillColor: '#3D9970', fillOpacity: 0.08 }} />}
            {markers.filter(hasPoint).map(location => <CircleMarker key={location.id} center={[location.latitude,location.longitude]} radius={selectedId === location.id ? 12 : 9} pathOptions={{ color: '#fff', weight: 3, fillColor: location.sourceStatus === 'out-of-service-temporarily' ? '#a65421' : selectedId === location.id ? '#173e2f' : '#3D9970', fillOpacity: 1 }} eventHandlers={{ click: () => select(location) }}><Popup autoPan={false}>{location.name}</Popup></CircleMarker>)}
            {userLocation && <CircleMarker center={userLocation} radius={7} pathOptions={{ color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }}><Popup autoPan={false}>Sinä olet täällä</Popup></CircleMarker>}
          </MapContainer>
          <p className="map-note" role="status">{gpsMessage || (park && !scopedLocations.length && !loading ? 'Puiston alueraja näkyy kartalla. Kohdetiedot puuttuvat vielä.' : 'Valitse piste kartalta tai kohde alla olevasta luettelosta.')}</p>
        {park && <p className="map-note">Alueraja: <a href={park.boundarySource} target="_blank" rel="noreferrer">{park.boundaryAttribution}</a>. Aineiston päiväys {park.boundaryUpdatedOn.split('-').reverse().join('.')}.</p>}
        </section>
        <aside className="place-card" aria-label="Valitun kohteen tiedot">
          {!selected ? <div className="empty-card"><span className="empty-icon">⌁</span><p className="eyebrow">LÖYDÄ OMA TAUKOPAIKKASI</p><h2>{park && !scopedLocations.length && !loading ? 'Kohdetiedot täydentyvät' : 'Mihin tänään?'}</h2><p>{park && !scopedLocations.length && !loading ? 'Puisto on mukana sovelluksessa. Taukopaikkojen tiedot lisätään, kun sopivaa aineistoa saadaan.' : 'Valitse kohde kartalta. Näet sen palvelut ja retkeilijöiden havainnot täällä.'}</p></div> : <>
            <div className="card-heading"><span className="type-tag">{typeNames[selected.type] || 'Retkikohde'}</span><button className="close-button" aria-label="Sulje kohdekortti" onClick={() => setSelectedId(null)}>×</button></div>
            <h2>{selected.name}</h2>{selected.description && <p className="description">{selected.description}</p>}
            {selected.sourceStatus === 'out-of-service-temporarily' && <p className="error-banner"><strong>Tilapäisesti pois käytöstä · {selected.source?.name}</strong><br />Lähteen muokkauspäivä: {selected.sourceStatusDate?.slice(0,10).split('-').reverse().join('.') || 'Ei tietoa'}. Käyttäjähavainnot näytetään erikseen.</p>}
            <UsageObservations key={`usage-${selected.id}`} locationId={selected.id} api={API} />
            <h3>Paikan palvelut</h3>
            <dl className="services"><div><dt>Käymälä</dt><dd>{yesNo(selected.services?.toilet)}</dd></div><div><dt>Vesipiste</dt><dd>{({ 'year-round': 'Ympärivuotinen', seasonal: 'Kausittainen', exists: 'Kaivo · saatavuus havaintojen mukaan' })[selected.services?.waterPoint] || 'Ei tietoa'}</dd></div><div><dt>Vapaa käyttö</dt><dd>{yesNo(selected.services?.freeUse)}</dd></div></dl>
            <p className="source-note">{selected.source ? <>Perustiedot: <a href={selected.source.url} target="_blank" rel="noreferrer">{selected.source.name}</a>.{selected.source.license && <> {selected.source.attribution} · <a href={selected.source.licenseUrl} target="_blank" rel="noreferrer">{selected.source.license}</a> · <a href={`${API}${selected.source.downloadUrl}`} target="_blank" rel="noreferrer">Lataa OSM-kohdeaineisto</a>.</>}</> : 'Palvelutietojen lähdettä ei ole saatavilla.'} Ei tietoa tarkoittaa, ettei palvelusta ole vahvistettua tietoa.</p>
            <p className="source-note">Vesipisteen kausikäyttö ei kerro veden juomakelpoisuudesta tai tämänhetkisestä toimivuudesta.</p>
            <WaterObservations key={selected.id} locationId={selected.id} api={API} knownWell={selected.type === 'water' && selected.services?.waterPoint === 'exists'} />
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

      <section className="place-list"><div className="list-heading"><div><p className="eyebrow">SEURAAVA PYSÄHDYS</p><h2>{searching ? 'Hakutulokset' : 'Kohteet kartan alueella'}</h2></div><label className="search">Hae kaikista kohteista<input type="search" value={search} onChange={e => { setSearch(e.target.value); setShownCount(6); }} placeholder="Etsi taukopaikka…" /></label></div><p className="source-note" role="status">{loading ? 'Ladataan kohteita…' : `Näytetään ${Math.min(shownCount, visible.length)} / ${visible.length} kohdetta. ${searching ? 'Haku kattaa kaikki sovelluksen kohteet.' : 'Siirrä tai lähennä karttaa rajataksesi listaa.'}`}</p><div className="place-grid">{visible.slice(0, shownCount).map(location => <button key={location.id} className={`place-option ${location.id === selectedId ? 'chosen' : ''}`} aria-pressed={location.id === selectedId} onClick={() => { select(location); document.querySelector('.explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span className="eyebrow">{typeNames[location.type] || 'Retkikohde'}</span><strong>{location.name}</strong>{location.sourceStatus === 'out-of-service-temporarily' && <span className="attention">Tilapäisesti pois käytöstä · LIPAS</span>}<span>{hasPoint(location) ? 'Näytä kohde ↗' : 'Sijainti puuttuu · Näytä tiedot'}</span></button>)}</div>{shownCount < visible.length && <button className="secondary show-more" type="button" onClick={() => setShownCount(count => count + 6)}>Näytä lisää</button>}{!loading && !loadError && !visible.length && <p>{searching ? 'Hakua vastaavia kohteita ei löytynyt. Kokeile toista nimeä.' : 'Tällä kartta-alueella ei ole kohteita. Loitonna tai siirrä karttaa, tai etsi kohdetta nimellä.'}</p>}</section>
      {!park && <section className="park-directory" aria-label="Kansallispuistot">{parks.map(p => <a className="park-link" key={p.slug} href={`#/parks/${p.slug}`}><span className="eyebrow">{p.region}</span><h2>{p.name}</h2><span>Tutustu puistoon ↗</span></a>)}</section>}
      {park && <section className="park-activity"><p className="eyebrow">RETKELTÄ KERROTTUA</p><h2>Viimeksi lisätyt raportit</h2>
        <p className="source-note">Tallennusjärjestyksessä. Näihin kuntoraportteihin ei vielä tallenneta käyntipäivää, joten järjestys ei kerro havaintojen tuoreudesta maastossa.</p>
        {reports.filter(r => park.locationIds.includes(r.location?.id)).sort((a,b) => b.id-a.id).slice(0,5).map(report => <article className="observation" key={report.id}>
          <button type="button" className="report-place-link" onClick={() => { const place = locations.find(p => p.id === report.location.id); if (place) { select(place); document.querySelector('.explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}>{report.location.name} ↗</button>
          <p>{targetNames[report.target] || targetNames.general} · {report.target === 'water' ? (report.status === 'ok' ? 'Toimii' : 'Ei toimi') : (report.status === 'ok' ? 'Kunnossa' : 'Ei kunnossa')}</p>{report.comment && <p>{report.comment}</p>}
        </article>)}
        {!reports.some(r => park.locationIds.includes(r.location?.id)) && <p>Alueen kohteista ei ole vielä raportteja.</p>}
      </section>}

    </main><footer>Konkari · Jätä jälkeesi hyödyllinen havainto.</footer>
  </div>;
}
