# Retkeilyapp – paikallinen kehitys Windowsissa

## Kohdekortit ja palvelut

Karttapisteen tai luettelon kohteen valinta avaa kohdekortin. Kortissa näkyvät
palvelut, lähde ja kohteen raportit sekä raportointilomake. Väripaletti:
Leaf Green `#3D9970`, Sand Beige `#F5F5DC`, valkoinen `#FFFFFF`.
Puhelimella kortti sijoittuu kartan alle. Kohteita voi hakea nimellä ja
oma sijainti haetaan painamalla "Paikanna minut".

Backend lukee LIPAS-palvelutiedot location_sources-taulun metadatasta.
Käymälä ja vapaa käyttö erotetaan arvoihin kyllä, ei ja ei tietoa.
Vesipisteellä näytetään kausikäyttö tai ei tietoa. Nämä eivät ole kuntohavaintoja
tai veden juomakelpoisuustietoja. Raportin aiheeksi valitaan yksi: kohde yleisesti,
käymälä tai vesipiste. Palvelun voi valita vain, jos sen olemassaolo tunnetaan
LIPAS-aineistosta. Raporttilistassa näkyy, mitä havainto koskee. Vapaa käyttö
on perustieto, eikä sille anneta kuntoarviota. Vanhat raportit ovat yleisiä arvioita.

Kahden oikean LIPAS-laavun [aineistokokeilu ja tietojen vertailu](data-preview/lipas/README.md)
on erillisessä kansiossa. Sen rajattu tuonti on kuvattu alla.

## Kahden LIPAS-laavun rajattu tuonti

Hae ensin näiden kahden laavun nykyiset tiedot LIPASista:

```powershell
.\retki.cmd backend fetch:lipas-preview
```

Haku näyttää muuttuneet kentät ja päivittää paikallisen GeoJSON-esikatselun.
Se ei muuta tietokantaa. Vain hakuaika voi muuttua, vaikka lähteen tiedot pysyvät samoina.
Molempien vastausten tulee läpäistä tarkistukset: esimerkiksi verkkovirhe tai
kohteen poistuminen aktiivisesta käytöstä keskeyttää haun ja säilyttää vanhan
esikatselun. Tällainen tilamuutos selvitetään erikseen; kohdetta ei poisteta automaattisesti.

Uudet alkuperäisvastaukset ja muutosyhteenveto säilyvät paikallisesti
`data-preview/lipas/fetches`-kansiossa. Kansio ei kuulu Gitiin. Alkuperäisen
kokeilun `73487.json` ja `73851.json` säilyvät alkuperäisinä otoksina.

Haku koskee vain tunnisteita 73487 ja 73851. Se ei etsi uusia kohteita Nuuksiosta
tai muualta Suomesta, eikä sitä ole ajastettu. Verkkohakua voi testata ilman
verkkoyhteyttä ja tietokantaa komennolla `.\retki.cmd backend test:lipas-fetch`.

Kun olet katsonut haun yhteenvedon, tuo esikatselun tiedot tietokantaan:

```powershell
.\retki.cmd backend import:lipas-preview
```

Komento lukee paikallisen `data-preview/lipas/nuuksio-laavut.geojson`-tiedoston.
Se hyväksyy vain tarkistetut LIPAS-tunnisteet 73487 ja 73851. Se ei hae uusia
tietoja verkosta eikä tuo muita kohteita.

Ensimmäinen ajo lisää kohteet ja luo tarvittaessa `location_sources`-taulun
SQL-tiedoston `backend/migrations/001-location-sources.sql` avulla.
Taulu yhdistää lähteen, aineistoryhmän ja lähdetunnisteen sovelluksen kohde-ID:hen.
Sama SQL voidaan suorittaa uudelleen. Tämä ei vielä ole koko sovelluksen
tietokannan luonti- tai migraatiojärjestelmä.

Seuraava ajo päivittää samojen kohteiden nimet, tyypit, koordinaatit ja lähdetiedot.
Kohde-ID, raportit ja muut olemassa olevat kentät säilyvät. Muita kohteita ei
yhdistetä nimen perusteella eikä poisteta. Lähteen lisätiedot, kuten käymälä ja
maksuttomuus, säilyvät lähdetaulun metadata-kentässä; niitä ei vielä näytetä käyttöliittymässä.
Tiedoston hakuaika säilyy alkuperäisenä: tuonnin ajaminen ei tee lähdetiedoista tuoreempia.

Koko tuonti suoritetaan yhtenä transaktiona. Virhe peruu sen tietokantamuutokset.
Rajapinnan `/locations` kautta kohteet tulevat nykyiselle kartalle sivun päivityksellä.

Uusintatuonnin ja raportin säilymisen tietokantatestin voi ajaa näin:

```powershell
.\retki.cmd backend test:lipas-import
```

Testi lisää väliaikaisen raportin, muuttaa lähteen nimeä ja tarkistaa pysyvät
kohdetunnisteet sekä raportin kohdeviittauksen. Lopuksi kaikki testimuutokset
perutaan. PostgreSQL:n tunnistelaskureihin voi jäädä aukkoja; se on normaalia.
Testi käyttää nykyistä paikallista tietokantaa, joten aja se kehitysympäristössä.

## 1. Projektin oma Node

Projektissa käytetään Node **22.23.2** -versiota. Koneen yhteistä Node-asennusta ei muuteta.
Suorita projektin juurikansiossa PowerShellissä kerran:

```powershell
powershell -File .\scripts\setup-node.ps1
```

Skripti lataa Windows x64 -paketin Node.js:n viralliselta palvelimelta,
tarkistaa SHA-256-tarkistussumman ja purkaa sen `.tools`-kansioon.
Kansio on jätetty Gitin ulkopuolelle.

## 2. Tarkista versiot

```powershell
.\retki.cmd versions
node --version
```

Ensimmäinen komento näyttää projektin Node- ja npm-versiot. Toinen näyttää
koneen tavallisen Noden, jonka pitäisi pysyä ennallaan.

## 3. Käynnistä käyttöliittymä

```powershell
.\retki.cmd frontend dev
```

Avaa terminaalissa näkyvä paikallinen osoite. Pysäytä palvelin painamalla Ctrl+C.
Projektissa on jo asennetut riippuvuudet; käynnistyskomento ei asenna tai päivitä niitä.

## 4. Taustapalvelu erillisessä terminaalissa

Käynnistä backend ensin ja käyttöliittymä toisessa terminaalissa. Kun backend on
valmis, avaa käyttöliittymä osoitteessa `http://localhost:5173/` (tai Viten ilmoittamassa
osoitteessa). Jos avasit sivun jo ennen backendin käynnistymistä, lataa sivu uudelleen.

```powershell
.\retki.cmd backend start:dev
```

Taustapalvelu käyttää porttia 3000 ja odottaa nykyisillä asetuksilla PostgreSQL-tietokantaa
`retkeilyapp` osoitteessa `localhost:5433`. Tietokannan ja sen taulujen täytyy olla valmiina.
Node-asennus ei luo tai muuta tietokantaa.

Pidä kummastakin palvelusta vain yksi käynnissä. `EADDRINUSE` ja portti `3000`
tarkoittavat, että portti on jo käytössä. Jos oma backendisi on jo käynnissä,
käytä sitä tai pysäytä se sen terminaalissa painamalla Ctrl+C ennen uutta käynnistystä.

### Backendin käännetyn version käynnistys

Pysäytä kehitysbackend ennen tämän vaihtoehdon käyttämistä:

```powershell
.\retki.cmd backend build
.\retki.cmd backend start:prod
```

Käännöksen käynnistystiedosto on `backend/dist/src/main.js`. Tuotantokäynnistys käyttää
sitä suoraan eikä seuraa lähdekoodin muutoksia. Tavalliseen kehitykseen käytä `start:dev`.

### Yhteiset tietokanta-asetukset

Backend ja Nuuksion tuontiskripti lukevat samat asetukset `backend/.env`-tiedostosta
yhteisen `backend/database.config.ts`-tiedoston kautta. Olemassa oleva `.env` säilytetään.
Uudessa ympäristössä kopioi `backend/.env.example` nimelle `backend/.env` ja täytä
tietokannan yhteystiedot sekä salasana. `.env` ei kuulu Gitiin.

`DB_HOST` on palvelimen osoite, `DB_PORT` portti, `DB_USER` käyttäjätunnus,
`DB_PASSWORD` salasana ja `DB_NAME` tietokannan nimi. Puuttuvista asetuksista ja
virheellisestä portista tulee selkeä virhe. Julkaisuympäristön ympäristömuuttujat
ohittavat paikallisen tiedoston arvot.

Tarkista yhteys projektin juurikansiosta:

```powershell
.\retki.cmd backend db:check
```

Komento tarkistaa yhteyden, `public.locations`- ja `public.reports`-taulujen olemassaolon
sekä PostGIS-laajennuksen. Se suorittaa vain lukukyselyitä eikä tuo kohteita tai muuta tietoja.
Taulujen sarakkeiden täydellistä vastaavuutta se ei tarkista.

## Raportin tallennuksen tarkistukset

`POST /reports` hyväksyy vain seuraavan muodon:

```json
{
  "location": { "id": 2 },
  "target": "general",
  "status": "ok",
  "comment": "Tulentekopaikka on kunnossa."
}
```

Kohteen tunnisteen pitää olla positiivinen kokonaisluku ja kohteen täytyy löytyä
tietokannasta. Tila on `ok` tai `not_ok`. Kommentti on vapaaehtoinen, enintään
2000 merkkiä. Ylimääräiset kentät, kuten raportin `id` tai `user_id`, hylätään
virheellä 400. Puuttuva kohde palauttaa virheen 404.

`target` on `general`, `toilet` tai `water`. Puuttuva arvo tulkitaan yleiseksi
arvioksi myös vanhojen asiakasohjelmien kanssa. Palvelin tarkistaa kohteen
LIPAS-metadatasta, että valittu palvelu tunnetaan; puuttuva tai tuntematon palvelu
palauttaa virheen 400. Vesipisteen arvio tarkoittaa toimivuutta, ei juomakelpoisuutta.

Ennen tämän version backendin käynnistystä uudessa tai vanhassa ympäristössä aja:

```powershell
.\retki.cmd backend db:report-target
```

Päivitys `backend/migrations/002-report-target.sql` lisää raporttitauluun
`target`-sarakkeen oletuksella `general`. Aiemmat raporttisisällöt säilyvät.
Komennon voi ajaa uudelleen. Nykyiseen kehitystietokantaan päivitys on jo ajettu.

Tallennus käyttää `insert`-operaatiota: se lisää uuden rivin eikä päivitä vanhaa
raporttia. Vastauksessa palautetaan myös kohteen tiedot käyttöliittymää varten.
Palvelin asettaa toistaiseksi demokäyttäjäksi tunnisteen `1`; kirjautumista tai
käyttäjän tunnistamista ei vielä ole toteutettu.

Käyttöliittymä näyttää tallennusvirheen ja säilyttää kirjoitetun kommentin virheen
sattuessa. Lähetyspainike on pois käytöstä tallennuksen ajan.

Raportoinnin testit voi ajaa ilman tietokantayhteyttä:

```powershell
.\retki.cmd backend test:reports
```

Testit ajavat HTTP-pyyntöjä erilliseen testisovellukseen, jonka tietokantatoiminnot
on korvattu testikorvikkeilla. Ne eivät lisää tai muuta oikeita raportteja.

## Miten käynnistys toimii?

`retki.cmd` lisää paikallisen Noden oman komentoprosessinsa PATH-muuttujan alkuun
ja suorittaa valitussa kansiossa `npm run` -komennon. `setlocal` rajaa muutoksen
tähän komentoon ja sen lapsiprosesseihin. Windowsin pysyvä PATH ja muiden terminaalien
ympäristöt eivät muutu.

Esimerkiksi `.\retki.cmd frontend build` tekee käyttöliittymän julkaisutiedostot
`frontend/dist`-kansioon.

Julkaisuympäristöön asennetaan yhteensopiva Node erikseen; Windowsin `.tools`-kansiota
ei julkaista palvelimelle. Tämä paikallinen käynnistystapa ei sido hosting-palvelun valintaa.
