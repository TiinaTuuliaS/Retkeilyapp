export const API = 'http://localhost:3000';
const KEY = 'konkari-offline-owner';
export const inside = (p, b) => Number.isFinite(p.longitude) && Number.isFinite(p.latitude) &&
  p.longitude >= b[0] && p.longitude <= b[2] && p.latitude >= b[1] && p.latitude <= b[3];

async function store(mode, action) {
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open('konkari-offline-area', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('area');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(Error('Offline-alueen tallennustila ei ole käytettävissä.'));
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction('area', mode), request = action(tx.objectStore('area'));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(Error('Aluetta ei voitu tallentaa. Tarkista laitteen vapaa tila.')); };
  });
}
export const readArea = () => store('readonly', s => s.get('ukk'));
export async function removeArea() {
  await store('readwrite', s => s.delete('ukk'));
  window.dispatchEvent(new Event('konkari-area'));
}
export function offlineOwner() {
  try { const u = JSON.parse(localStorage.getItem(KEY)); return Number.isInteger(u?.id) ? { id: u.id, displayName: u.displayName, offline: true } : null; }
  catch { return null; }
}
export function rememberOwner(user) {
  // No password, email, role or session token is persisted here. This is NOT authentication.
  if (user && !user.offline) localStorage.setItem(KEY, JSON.stringify({ id: user.id, displayName: user.displayName }));
}
export function forgetOwner() { localStorage.removeItem(KEY); }

export async function publicFetch(url, options = {}) {
  try {
    const response = await fetch(url, { ...options, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(7000)]) : AbortSignal.timeout(7000) });
    if (response.status < 500) return response;
    throw Error('Palvelin ei vastaa.');
  } catch (error) {
    if (options.signal?.aborted) throw error;
    const pack = await readArea();
    const path = new URL(url).pathname;
    if (pack && Object.hasOwn(pack.data, path)) {
      window.dispatchEvent(new Event('konkari-cached-data'));
      return new Response(JSON.stringify(pack.data[path]), { headers: { 'Content-Type': 'application/json' } });
    }
    throw error;
  }
}
export async function shellReady() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return false;
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 3000);
    channel.port1.onmessage = e => { clearTimeout(timer); resolve(e.data === true); channel.port1.close(); };
    navigator.serviceWorker.controller.postMessage('CHECK_SHELL', [channel.port2]);
  });
}
export async function downloadArea(manifest, user, progress, signal) {
  if (!user || user.offline) throw Error('Kirjaudu verkkoyhteydessä ennen alueen tallentamista.');
  if (!await shellReady()) throw Error('Avaa offline-kokeilu ohjeen mukaisessa esikatselussa ja lataa sivu uudelleen ennen tallennusta.');
  const get = async path => {
    const response = await fetch(API + path, { signal, cache: 'no-store' });
    if (!response.ok) throw Error('Kohdetietojen lataus epäonnistui. Aiempi tallennus säilyi.');
    return response.json();
  };
  progress('Ladataan karttaa…');
  const response = await fetch(manifest.image, { signal, cache: 'no-store' });
  if (!response.ok) throw Error('Karttaa ei saatu ladattua.');
  const bytes = await response.arrayBuffer();
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  if (bytes.byteLength !== manifest.bytes || hash !== manifest.sha256) throw Error('Kartan eheystarkistus epäonnistui.');
  progress('Tallennetaan alueen kohteet ja havainnot…');
  const [parks, park, locations, reports] = await Promise.all(['/parks', '/parks/ukk', '/locations', '/reports'].map(get));
  if (![parks, locations, reports].every(Array.isArray)) throw Error('Kohdetietojen muoto on virheellinen.');
  const selected = locations.filter(p => inside(p, manifest.bounds));
  const ids = new Set(selected.map(p => p.id));
  const data = { '/parks': parks.filter(p => p.slug === 'ukk'), '/parks/ukk': { ...park, locationIds: selected.map(p => p.id) },
    '/locations': selected, '/reports': reports.filter(r => ids.has(r.location?.id)) };
  for (const place of selected) {
    for (const kind of ['water-observations', 'usage-observations']) {
      const path = `/locations/${place.id}/${kind}`;
      data[path] = await get(path);
      if (!Array.isArray(data[path])) throw Error('Havaintotietojen muoto on virheellinen.');
    }
  }
  if (signal.aborted) throw new DOMException('Keskeytetty', 'AbortError');
  const pack = { manifest, data, savedAt: new Date().toISOString(), image: new Blob([bytes], { type: 'image/webp' }) };
  // Persist the complete area in ONE transaction. Failed refresh retains the previous complete copy.
  rememberOwner(user);
  await store('readwrite', s => s.put(pack, 'ukk'));
  await navigator.storage?.persist?.().catch(() => false);
  window.dispatchEvent(new Event('konkari-area'));
  return pack;
}
