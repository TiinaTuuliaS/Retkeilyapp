# Kolin rajattu LIPAS-tuonti

24.9.2026 tuotiin kolme tulentekopaikkaa: Ikolanaho (LIPAS 509040, paikallinen
ID 239), Turula (509042, ID 240) ja Paimenenvaara (511172, ID 241).
Puistosivu: http://localhost:5173/#/parks/koli

Kaikki ovat lähteessä aktiivisia ja vapaasti käytettäviä; kaikilla on
käymälämerkintä. Paimenenvaaran lähdekuvaus mainitsee kaivon. Kuvaus säilytettiin
kohdekortilla, mutta erillinen vesipisteen kausikäyttötieto puuttuu. Kaivon
nykyistä saatavuutta tai juomakelpoisuutta ei ole vahvistettu. Käyttäjät voivat
kirjata päivättyjä vesihavaintoja nykyisellä lomakkeella.

Ehdokkaat poimittiin valtakunnallisesta 7.9.2026 otoksesta (luokat 301 ja 206),
ja yksittäiset tietueet päivitettiin 24.9.2026. Uusia tämän jälkeen otokseen
lisättyjä kohteita ei ole etsitty kattavasti. Tämä ei ole kaikkien Kolin
palveluiden inventointi. OSM-täydennyksiä ei tässä vaiheessa haettu.
Vastaukset ja hakuajat: `raw.json`; sijainnit ja tiedot: `sites.geojson`.

Puistoraja KPU070027, lähteen muokkauspäivä 1.7.2025. Metsähallitus / Syke,
jakelu GTK, CC BY 4.0:
https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5

## Toistaminen projektin juuresta

```powershell
.\retki.cmd backend preview:lipas-koli
.\retki.cmd backend test:koli-import
.\retki.cmd backend import:lipas-koli
```

Tuonti käyttää paikallista otosta ja kiinteää kolmen lähdetunnisteen listaa.
Ei ajastusta. PostGIS varmisti sijainnit rajan sisälle ja tarkisti ennen
lisäämistä, ettei 30 metrin sisällä ole olemassa olevaa kohdetta.
Koetuonti varmisti tunnisteiden, kohdemäärän, raportin ja käyttötilahavainnon
säilymisen uusintatuonnissa. Testitiedot peruttiin. Varsinainen tuonti tarkisti
raporttien, vesi- ja käyttötilahavaintojen sisältötiivisteiden säilymisen.
Puistosivujen testit ja backendin käännös onnistuivat. Visuaalista selaintestiä
ei tehty.
