import { useEffect, useState } from 'react';
import App from './App';

const API = 'http://localhost:3000';
export default function ParkRouter() {
  const [route, setRoute] = useState(() => window.location.hash);
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const change = () => { setRoute(window.location.hash); setPage(null); setError(''); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    const slug = route.startsWith('#/parks/') ? route.slice(8) : null;
    async function load() {
      const get = async endpoint => {
        const response = await fetch(`${API}/${endpoint}`, { signal: abort.signal });
        if (!response.ok) throw new Error(response.status === 404 ? 'Puistosivua ei löydy.' : 'Puistotietojen lataus epäonnistui.');
        return response.json();
      };
      const [parks, park] = await Promise.all([get('parks'), slug ? get(`parks/${encodeURIComponent(slug)}`) : null]);
      if (!Array.isArray(parks)) throw new Error('Puistotietojen lataus epäonnistui.');
      if (!abort.signal.aborted) setPage({ parks, park, route });
    }
    load().catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => abort.abort();
  }, [route, attempt]);
  if (!page || page.route !== route) return <main className="route-status"><a href="#/">← Kaikki kohteet</a>
    {error ? <><p role="alert">{error}</p><button onClick={() => { setError(''); setAttempt(n => n+1); }}>Yritä uudelleen</button></> : <p role="status">Ladataan puistotietoja…</p>}</main>;
  return <App key={route} parks={page.parks} park={page.park} />;
}
