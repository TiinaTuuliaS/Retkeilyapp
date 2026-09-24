import { createContext, useContext, useEffect, useState } from 'react';
import PersonalSpace from './PersonalSpace';
import SocialSpace from './Community';
export const API = 'http://localhost:3000';
const Auth = createContext(null);
export async function accountRequest(path, options = {}) {
  const r = await fetch(`${API}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = await r.text();
  const data = body ? JSON.parse(body) : null;
  if (!r.ok) {
    if (r.status === 401) window.dispatchEvent(new Event('konkari-session-expired'));
    throw Error(typeof data?.message === 'string' ? data.message : 'Pyyntö epäonnistui.');
  }
  return data;
}
export const useAccount = () => useContext(Auth);
export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    setError(''); setLoading(true);
    try { setUser(await accountRequest('/auth/me')); }
    catch { setError('Kirjautumistilaa ei voitu tarkistaa.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let live = true;
    accountRequest('/auth/me').then(u => { if(live) setUser(u); }).catch(() => { if(live) setError('Kirjautumistilaa ei voitu tarkistaa.'); }).finally(() => { if(live) setLoading(false); });
    const expired = () => setUser(null);
    window.addEventListener('konkari-session-expired', expired);
    return () => { live = false; window.removeEventListener('konkari-session-expired', expired); };
  }, []);
  return <Auth.Provider value={{ user, setUser, loading, error, refresh }}>{children}</Auth.Provider>;
}
export function AccountLink() {
  const { user } = useAccount();
  return <><a className="account-link" href="#/community">Retkikuulumiset</a><a className="account-link" href="#/account">{user ? 'Oma sivu' : 'Kirjaudu'}</a></>;
}
export function SaveLocation({ locationId }) {
  const { user } = useAccount();
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    if(user) accountRequest('/account').then(data => { if(live) { setSaved(data.saved.some(p => p.id === locationId)); setReady(true); } }).catch(e => { if(live) setError(e.message); });
    return () => { live = false; };
  }, [user, locationId, attempt]);
  if (!user) return <p className="source-note"><a href="#/account">Kirjaudu</a> tallentaaksesi kohteen omalle sivullesi.</p>;
  return <div className="save-location"><button className="secondary" disabled={!ready || busy} onClick={async () => {
    setBusy(true); setError('');
    try { await accountRequest(`/account/saved/${locationId}`, { method: saved ? 'DELETE' : 'PUT' }); setSaved(v => !v); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }}>{busy ? 'Tallennetaan…' : saved ? '✓ Tallennettu · Poista tallennus' : 'Tallenna kohde'}</button>
    {error && <p role="alert">{error} <button type="button" onClick={() => { setError(''); setAttempt(n=>n+1); }}>Yritä uudelleen</button></p>}</div>;
}
const statusNames = { ok:'Kunnossa',not_ok:'Ei kunnossa',available:'Vettä oli saatavilla',unavailable:'Vettä ei ollut saatavilla',unknown:'Ei varmistettu',in_use:'Oli käytössä',not_in_use:'Ei ollut käytössä' };
const kindNames = { report:'Kuntoraportti',water:'Vesihavainto',usage:'Käyttötilahavainto' };
export default function AccountPage() {
  const { user,setUser,loading,error,refresh } = useAccount();
  const [register,setRegister] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [data,setData] = useState(null);
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    if(user) accountRequest('/account').then(d => { if(live) setData({ ...d, owner:user.id }); }).catch(e => { if(live) setMessage(e.message); });
    return () => { live = false; };
  }, [user,retry]);
  return <><header className="site-header"><a className="brand" href="#/">⌁ Konkari</a><a href="#/">← Takaisin kartalle</a></header><main className="account-page">
    <h1>{user ? 'Oma sivu' : register ? 'Luo Konkari-tili' : 'Kirjaudu Konkariin'}</h1>
    {loading ? <p>Ladataan kirjautumistilaa…</p> : error ? <p role="alert">{error} <button onClick={refresh}>Yritä uudelleen</button></p> : !user ? <>
      <p>Tallenna kiinnostavat kohteet ja löydä omat havaintosi samasta paikasta.</p>
      <form className="report-form account-form" onSubmit={async e => {
        e.preventDefault(); if(busy) return; setBusy(true); setMessage('');
        const form=e.currentTarget;
        const fields=Object.fromEntries(new FormData(form));
        try { const u=await accountRequest(register ? '/auth/register' : '/auth/login', {method:'POST',body:JSON.stringify(fields)}); form.reset(); setUser(u); }
        catch(err) { setMessage(err instanceof TypeError ? 'Palvelimeen ei saatu yhteyttä.' : err.message); }
        finally { setBusy(false); }
      }}>
        {register && <><label htmlFor="display-name">Nimimerkki</label><input id="display-name" name="displayName" autoComplete="nickname" required minLength={2} maxLength={60} disabled={busy} /></>}
        <label htmlFor="email">Sähköposti</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} disabled={busy} />
        <label htmlFor="password">Salasana (12–128 merkkiä)</label><input id="password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} disabled={busy} />
        <button className="primary" disabled={busy}>{busy ? 'Odota…' : register ? 'Luo tili' : 'Kirjaudu'}</button>
      </form><button className="secondary account-switch" disabled={busy} onClick={() => { setRegister(v=>!v); setMessage(''); }}>{register ? 'Minulla on jo tili' : 'Luo uusi tili'}</button>
    </> : <>
      <details className="account-settings"><summary>Tilin tiedot</summary><p>Tilisi sähköposti: {user.email}</p><button className="secondary" disabled={busy} onClick={async () => {
        setBusy(true); setMessage('');
        try { await accountRequest('/auth/logout',{method:'POST'}); setUser(null); setData(null); }
        catch(e) { setMessage(e.message); } finally { setBusy(false); }
      }}>Kirjaudu ulos</button></details>
      {!data || data.owner!==user.id ? <p>Ladataan omaa sivua…</p> : <>
        <PersonalSpace key={user.id} name={user.displayName} />
        <SocialSpace key={`social-${user.id}`} userId={user.id} />
        <section className="account-section"><h2>Tallennetut kohteet ({data.saved.length})</h2>
          {!data.saved.length && <p>Tallenna ensimmäinen kohde kartan kohdekortista.</p>}
          <div className="place-grid">{data.saved.map(place => <a className="place-option" key={place.id} href={`#/location/${place.id}`}><strong>{place.name}</strong><span>Näytä kartalla ↗</span></a>)}</div>
        </section>
        <section className="account-section"><h2>Omat havainnot ({data.observations.length})</h2>
          <p className="source-note">Havainnot ovat julkisia kohdekorteilla. Tallennettujen kohteiden lista näkyy vain sinulle. Vanhoja demohavaintoja ei liitetä tiliisi.</p>
          {!data.observations.length && <p>Et ole vielä lisännyt havaintoja tällä tilillä.</p>}
          {data.observations.map(item => <article className="observation" key={`${item.kind}-${item.id}`}><a href={`#/location/${item.locationId}`}>{item.name}</a><p>{kindNames[item.kind]} · {statusNames[item.status] || item.status}</p><p>{item.observedOn ? `Käyntipäivä ${item.observedOn.split('-').reverse().join('.')}` : 'Käyntipäivää ei tallennettu'}</p><p>{item.comment}</p></article>)}
        </section>
      </>}
    </>}
    {message && <p role="alert">{message}{user && <button onClick={() => { setMessage(''); setRetry(n=>n+1); }}>Yritä uudelleen</button>}</p>}
  </main></>;
}
