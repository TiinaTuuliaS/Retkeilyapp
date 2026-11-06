# UKK:n rajattu offline-kokeilu

## Mitä mukana on

- Kiilopää–Luulampi: 27.38–27.56 E, 68.32–68.40 N (noin 7 × 9 km).
- MML:n vuoden 2025 maastokartta, 3 204 066 tavua, ei koko UKK:n kartta.
- Tallennushetken kohteet ja niiden kunto-, vesi- ja käyttötilahavainnot.
  Nykyisessä tietokannassa rajaukseen osuu Sivakkaojan laavu. Kartassa näkyvät
  muut symbolit eivät itsessään luo uusia raportoitavia kohteita.
- Sovelluksen avaaminen uudelleen ilman verkkoa samassa selaimessa ja osoitteessa.
- Havaintojen paikallinen tallennus ja lähetys yhteyden palattua sovelluksen ollessa auki.

## Käynnistä kokeilu

1. Backend normaalisti: `./retki.cmd backend start:dev`.
2. Pysäytä frontendin `dev`-terminaali Ctrl+C:llä.
3. Projektin juuresta:

   ```powershell
   .\retki.cmd frontend build
   .\retki.cmd frontend preview
   ```

4. Avaa `http://localhost:5173/`, kirjaudu ja avaa **UKK mukaan katveeseen**.
   Jos painike on aluksi pois käytöstä, päivitä sivu: sovelluksen tiedostojen
   pitää ensin valmistua selaimen offline-välimuistiin.
5. Valitse **Tallenna alue offline-käyttöön**. Odota vahvistusta. Näytä tallennettu alue.
6. Katkaise yhteys / käytä selaimen kehittäjätyökalujen Offline-tilaa.
   Sulje välilehti ja avaa sama osoite uudelleen. Avaa Sivakkaojan laavu ja tee havainto.
7. Palauta yhteys ja pidä Konkari auki. Tarkista lähetysjonosta lähetystila.
   Jos istunto on vanhentunut, kirjaudu takaisin samalle tilille.

Paluu kehityspalvelimeen: pysäytä preview, käynnistä `./retki.cmd frontend dev`
ja avaa **http://localhost:5173/?dev=1**. Tämä ohittaa vanhan offline-aloitussivun
ja poistaa tämän sovelluksen service workerin. Havaintojono ja alue jäävät laitteelle.
Älä tyhjennä selaimen tietoja, jos lähettämättömiä havaintoja on jäljellä.

Puhelimella localhost tarkoittaa puhelinta, ei kehityskonetta. Oikea puhelintesti
vaatii HTTPS-ympäristön ja API-osoitteiden sekä CORS-/istuntoasetusten valmistelun.
Tämä työ ei julkaise sovellusta. Pelkkä HTTP-lähiverkko-osoite ei riitä service workerille.

## Mitä valmis tarkoittaa

Kartan tavumäärä ja SHA-256 tarkistetaan. Kartta ja kaikki alueen julkiset tiedot
tallennetaan yhtenä IndexedDB-transaktiona. Keskeytys, verkkovirhe tai tilan loppuminen
ei korvaa aiempaa valmista aluetta. Latauspainike edellyttää myös valmista sovelluksen
välimuistia. Tallennusajankohta ja rajaus näkyvät käyttöliittymässä.

Selain voi poistaa tietoja tilan loppuessa. Pysyvää tallennusta pyydetään, mutta
selain voi hylätä pyynnön. Tallennus ei ole varmuuskopio. Käyttäjä voi poistaa
alueen erikseen; se ei poista havaintojonoa. Kartta ei päivity taustalla.

## Kirjautuminen ja tietojen rajaus

Offline-havainnoille muistetaan vain viimeksi vahvistetun käyttäjän id ja nimimerkki.
Salasanaa, sähköpostia, roolia tai istuntotunnistetta ei tallenneta tähän muistioon.
Se ei todista kirjautumista eikä anna palvelinoikeuksia. Uloskirjautuminen tai
palvelimen vastaus ilman käyttäjää poistaa muistetun tunnisteen.
Lähetysjono tarkistaa aina todellisen istunnon sekä saman käyttäjän ennen POSTia.
Eri käyttäjän kirjautuminen ei lähetä aiemman käyttäjän jonoa.

Oma sivu, päiväkirja, kaverit ja retkisuunnitelmat eivät toimi offline-tilassa.
API:n kirjautumisvastauksia ei välimuistiteta. Service worker tallentaa vain
rakennetun sovelluksen omat tiedostot; se ei käsittele APIa tai OSM-karttatiiliä.
Kohdeaineisto on erillinen, rajattu julkinen tilannekuva IndexedDB:ssä.

## Kartan alkuperä ja toistaminen

Maastotiedot © Maanmittauslaitos 2025, CC BY 4.0, jakelu CSC/Paituli.
Lähde: https://www.nic.funet.fi/index/geodata/mml/peruskartta/2025/V5/V52/V5211R.png
Lisenssi: https://creativecommons.org/licenses/by/4.0/
Tuotekuvaus: https://www.maanmittauslaitos.fi/kartat-ja-paikkatieto/aineistot-ja-rajapinnat/tuotekuvaukset/maastokarttasarja-rasteri

`scripts/prepare-offline-ukk.py` rajaa ja muuntaa kartan EPSG:3067 → EPSG:3857
sekä pienentää sen WebP-kuvaksi. `frontend/public/offline/ukk.json` sisältää
rajat, koon, lähteen ja tarkistussumman. Kartta on muunnettu alkuperäisestä;
se ei ole viranomaisen ylläpitämä ajantasainen verkkokartta.

Muunnoskirjastot on asennettu vain `.tools/offline-python`-ympäristöön
(Pillow, NumPy, pyproj, rasterio). Tiedostot palvellaan omasta frontendistä.
Puhelin ei lataa karttapakettia MML:n tai OSM:n karttakuvapalvelusta.

## Tarkistukset

`scripts/test-offline-browser.mjs` käyttää erillistä Chromium-profiilia ja
simuloitua käyttäjää. Se lukee backendistä vain julkisia GET-tietoja;
kirjautuminen ja havaintojen POST-pyynnöt on korvattu testivastauksilla.
Testi tarvitsee backendin, frontend-buildin ja preview-palvelimen portissa 4175.
Työkalut: `.tools/offline-test/node_modules/playwright` ja asennettu Chromium.

```powershell
# frontend-kansiossa testin preview:
..\.tools\node-v22.23.2-win-x64\node.exe node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4175 --strictPort
# juurikansiossa:
.\.tools\node-v22.23.2-win-x64\node.exe scripts/test-offline-browser.mjs
.\.tools\node-v22.23.2-win-x64\node.exe --test frontend/src/observation-outbox.test.js
```

Testataan täydellinen lataus, vioittunut päivitys, koko selaimen uudelleenavaaminen
ilman verkkoa, kartan piirtyminen, raportin säilyminen uudelleenlatauksessa,
käyttäjän vaihtuminen ja istunnon vanheneminen sekä oikean käyttäjän kertalähetys.
390 px näkymä tarkistetaan myös. Testitulokset ja kuvakaappaukset jäävät ohitettuun
`.tools/offline-test-results`-kansioon. Oikean puhelimen GPS/lentotilatesti on vielä
tehtävä HTTPS-ympäristössä ennen maastokäyttöön luottamista.
