import { useEffect, useRef, useState } from 'react';
import { useAccount } from './Account';
import { downloadArea, readArea, removeArea, shellReady } from './offline-area';

export default function OfflineArea({ pack, active, onToggle }) {
  const { user } = useAccount();
  const [manifest, setManifest] = useState(null), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const request = useRef(null);
  useEffect(() => {
    let live = true;
    fetch('/offline/ukk.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(m => { if (live) setManifest(m); }).catch(() => {});
    shellReady().then(ok => { if (live) setReady(ok); });
    const check = () => shellReady().then(ok => { if (live) setReady(ok); });
    navigator.serviceWorker?.addEventListener('controllerchange', check);
    return () => { live = false; request.current?.abort(); navigator.serviceWorker?.removeEventListener('controllerchange', check); };
  }, []);
  const m = manifest || pack?.manifest;
  return <section className="offline-area" aria-label="Offline-karttakokeilu">
    <details><summary>UKK mukaan katveeseen · kokeilu {pack ? "· alue tallennettu" : "· tallenna alue ennen retkeä"}</summary><div>
      <p>Kiilopää–Luulampi, noin 7 × 9 km. Rajattu alue, ei koko kansallispuisto. Maastokartta 2025.</p>
      {pack ? <p role="status">✓ Alue tallennettu {new Date(pack.savedAt).toLocaleString('fi-FI')} · {pack.data['/locations'].length} kohdetta. {ready ? 'Sovellus on tallennettu offline-avaamista varten.' : 'Offline-avaamista ei ole varmistettu tässä näkymässä.'}</p> : <p>Kirjaudu ja tallenna alue verkkoyhteydessä ennen retkeä. Kartta {m ? (m.bytes / 1e6).toFixed(1) : 'noin 3,2'} Mt + kohdetiedot.</p>}
      {active && <p><strong>Näytetään tallennettua kokeilualuetta.</strong> Tiedot ovat tallennushetkeltä. Kartan ulkopuolella ei ole ladattua karttaa.</p>}
    </div>
    <div className="journal-actions">
      {pack && <button className="secondary" onClick={onToggle}>{active ? 'Palaa verkkokarttaan' : 'Näytä tallennettu alue'}</button>}
      <button className="primary" disabled={busy || !manifest || !user || user.offline || !ready} onClick={async () => {
        const controller = new AbortController(); request.current = controller;
        setBusy(true); setMessage('Valmistellaan…');
        try {
          await downloadArea(manifest, user, setMessage, controller.signal);
          const saved = await readArea();
          setMessage(`Alue valmis: kartta ja ${saved.data['/locations'].length} kohdetta tallennettu. Voit nyt kokeilla lentotilaa ja avata Konkarin uudelleen.`);
        } catch (e) { setMessage(e.name === 'AbortError' ? 'Tallennus keskeytettiin. Aiempi alue säilyi.' : e.message); }
        finally { setBusy(false); }
      }}>{busy ? 'Tallennetaan…' : pack ? 'Päivitä tallennettu alue' : 'Tallenna alue offline-käyttöön'}</button>
      {busy && <button className="secondary" onClick={() => request.current?.abort()}>Keskeytä</button>}
      {pack && !busy && <button className="secondary" onClick={async () => {
        if (!window.confirm('Poistetaanko tallennettu kartta ja alueen kohdetiedot tältä laitteelta? Lähettämättömät havainnot säilyvät.')) return;
        try { await removeArea(); setMessage('Offline-alue poistettu. Havaintojono säilyi.'); } catch(e) { setMessage(e.message); }
      }}>Poista alue laitteelta</button>}
    </div>
    {!ready && <p className="source-note">Offline-avaaminen toimii rakennetussa esikatseluversiossa, ei kehityspalvelimella. Katso projektin offline-ohje.</p>}
    {!user && <p><a href="#/account">Kirjaudu ennen alueen tallentamista.</a></p>}
    <p className="source-note">Tallennus on tällä laitteella ja tässä selaimessa. Selaintietojen poisto voi hävittää kartan ja lähettämättömät havainnot. Oma sivu ja retkipäiväkirja tarvitsevat edelleen yhteyden.</p>
    {m && <p className="source-note">{m.attribution}. <a href={m.licenseUrl} target="_blank" rel="noreferrer">Lisenssi</a> · <a href={m.source} target="_blank" rel="noreferrer">Alkuperäinen karttalehti</a>. Kartta on rajattu, muunnettu verkkokartan koordinaatistoon ja pienennetty kokeilua varten.</p>}
    {message && <p role="status">{message}</p>}
    </details>
  </section>;
}
