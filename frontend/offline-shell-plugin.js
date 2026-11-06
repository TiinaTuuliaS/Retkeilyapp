import { createHash } from 'node:crypto';

// Production/preview only: development's module graph is deliberately never cached.
export default function offlineShell() {
  return {
    name: 'konkari-offline-shell',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(p => p === 'index.html' || p.startsWith('assets/')).map(p => '/' + p);
      if (!files.includes('/index.html')) files.push('/index.html');
      const version = createHash('sha256').update(JSON.stringify(bundle)).digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = 'konkari-shell-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', e => e.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(FILES);
})()));
// No skipWaiting: an existing page keeps the shell version it loaded.
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const key of await caches.keys()) if(key.startsWith('konkari-shell-') && key!==CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', e => {
  if(e.data==='CHECK_SHELL') e.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const entries=await Promise.all(FILES.map(p=>cache.match(p)));
    e.ports[0]?.postMessage(entries.every(Boolean));
  })());
});
self.addEventListener('fetch', e => {
  const url=new URL(e.request.url);
  // Never intercept API, auth, mutations, OSM tiles or third-party requests.
  if(e.request.method!=='GET'||url.origin!==self.location.origin) return;
  if(e.request.mode==='navigate' && url.searchParams.has('dev')) return;
  if(e.request.mode==='navigate' && url.pathname==='/') {
    e.respondWith(caches.open(CACHE).then(c=>c.match('/index.html')).then(r=>r||fetch(e.request))); return;
  }
  if(FILES.includes(url.pathname)) e.respondWith(caches.open(CACHE).then(c=>c.match(url.pathname)).then(r=>r||fetch(e.request)));
});` });
    },
  };
}
