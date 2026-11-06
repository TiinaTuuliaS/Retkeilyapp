// Isolated browser, mocked account and writes. Only public GETs hit the running backend.
// Setup: npm install --prefix .tools/offline-test playwright; playwright install chromium
// Run built preview on 127.0.0.1:4175 before this script.
import { chromium } from '../.tools/offline-test/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = 'http://127.0.0.1:4175';
await mkdir('.tools/offline-test-results', { recursive: true });
const profile = await mkdtemp(resolve('.tools/offline-test-results/profile-'));
const fixtures = {};
for (const path of ['/parks', '/parks/ukk', '/locations', '/reports']) {
  const r = await fetch('http://localhost:3000' + path);
  assert.equal(r.status, 200); fixtures[path] = await r.json();
}
let disconnected = false, sent = [], badImage = false, identity = { id: 999999, displayName: 'Offline test', role: 'user' };
const errors = [];
async function launch() {
  const context = await chromium.launchPersistentContext(profile, { headless: true, viewport: { width: 1280, height: 900 } });
  await context.route('http://localhost:3000/**', async route => {
    if (disconnected) return route.abort('internetdisconnected');
    const path = new URL(route.request().url()).pathname;
    let body;
    if (path === '/auth/me') body = identity;
    else if (path === '/account/observations') { body = { id: 12345 + sent.length, ...route.request().postDataJSON().data }; sent.push(route.request().postDataJSON()); }
    else if (path === '/account') body = { saved: [], observations: [] };
    else body = fixtures[path] ?? [];
    await route.fulfill({ json: body, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
  });
  await context.route('**/offline/ukk-kiilopaa.webp', route => badImage ? route.fulfill({ body: 'incomplete', contentType: 'image/webp' }) : route.continue());
  const page = context.pages()[0];
  page.on('pageerror', e => errors.push(e.message));
  return { context, page };
}
let { context, page } = await launch();
try {
  await page.goto(base + '/#/parks/ukk');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByText('UKK mukaan katveeseen', { exact: false }).click();
  await page.getByRole('button', { name: 'Tallenna alue offline-käyttöön' }).click();
  await page.getByText('Alue valmis:', { exact: false }).waitFor();
  const storedAt = await page.evaluate(async () => {
    const db = await new Promise(r => { const q = indexedDB.open('konkari-offline-area'); q.onsuccess = () => r(q.result); });
    const pack = await new Promise(r => { const q = db.transaction('area').objectStore('area').get('ukk'); q.onsuccess = () => r(q.result); });
    db.close(); return pack.savedAt;
  });
  badImage = true;
  await page.getByRole('button', { name: 'Päivitä tallennettu alue' }).click();
  await page.getByText('Kartan eheystarkistus epäonnistui.').waitFor();
  assert.ok(await page.getByText('Alue tallennettu', { exact: false }).count());
  assert.equal(await page.evaluate(async () => {
    const db = await new Promise(r => { const q=indexedDB.open('konkari-offline-area'); q.onsuccess=()=>r(q.result); });
    const pack=await new Promise(r=>{const q=db.transaction('area').objectStore('area').get('ukk');q.onsuccess=()=>r(q.result);});db.close();return pack.savedAt;
  }), storedAt);
  badImage = false;
  // Close the entire browser, then launch offline: not merely a warmed-up tab.
  await context.close();
  disconnected = true;
  ({ context, page } = await launch());
  await context.setOffline(true);
  await page.goto(base + '/#/parks/ukk');
  await page.locator('.leaflet-image-layer').waitFor();
  assert.equal(await page.locator('.leaflet-tile').count(), 0);
  assert.ok(await page.locator('.leaflet-image-layer').evaluate(img => img.complete && img.naturalWidth > 0));
  await page.getByRole('button', { name: /Sivakkaojan laavu/ }).click();
  await page.locator('#comment').fill('Offline test only, never sent to the real database.');
  await page.getByRole('button', { name: 'Tallenna havainto', exact: true }).click();
  await page.getByText('Havainto tallennettu tälle laitteelle.', { exact: false }).waitFor();
  await page.reload();
  await page.getByText('1 lähetysjonossa', { exact: false }).waitFor();
  await page.screenshot({ path: '.tools/offline-test-results/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const map=document.querySelector('.map').getBoundingClientRect(), img=document.querySelector('.leaflet-image-layer').getBoundingClientRect();
    return img.right>map.left && img.left<map.right && img.bottom>map.top && img.top<map.bottom;
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: '.tools/offline-test-results/mobile.png', fullPage: true });
  // A different online user must not receive the old user's pending observation.
  identity = { id: 999998, displayName: 'Other test', role: 'user' };
  disconnected = false;
  await context.setOffline(false);
  await page.reload();
  await page.getByText('Havainnot kulkevat mukana myös katveessa', { exact: false }).waitFor();
  await page.waitForTimeout(1200);
  assert.equal(sent.length, 0);
  // An expired server session must clear local identity, never impersonate the old account.
  identity = null;
  await page.reload();
  await page.getByRole('link', { name: 'Kirjaudu', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('konkari-offline-owner')), null);
  identity = { id: 999999, displayName: 'Offline test', role: 'user' };
  await page.reload();
  await page.getByText('Havainnot lähetetty', { exact: false }).waitFor();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].accountId, 999999);
  assert.equal(sent[0].data.comment, 'Offline test only, never sent to the real database.');
  await page.getByText('UKK mukaan katveeseen', { exact: false }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Poista alue laitteelta' }).click();
  await page.getByText('Offline-alue poistettu. Havaintojono säilyi.').waitFor();
  await page.getByText('Havainnot lähetetty', { exact: false }).waitFor();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, tested: ['complete download', 'corrupt update rejected', 'browser closed and reopened offline', 'local raster rendered', 'offline report survives reload', 'wrong account never sends', 'same account syncs once', '390px no overflow'], previousSnapshot: storedAt }));
} finally { await context.close(); }
