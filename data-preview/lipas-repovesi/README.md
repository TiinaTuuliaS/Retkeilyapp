# Repoveden rajattu LIPAS-tuonti

Samana päivänä puistoa täydennettiin kahdella OSM-kohteella: Lojukosken
taukopaikalla ja kaivolla. [OSM-tarkistus ja tuonti](../osm-parks/repovesi-review.md).
Alla kuvataan alkuperäisen yhden LIPAS-kohteen tuonti.

24.9.2026 tuotiin **Repoveden Kirnukankaan laavu**, LIPAS 73643,
paikallinen kohdetunniste 243. Puistosivu: http://localhost:5173/#/parks/repovesi

Lähde ilmoittaa kohteen aktiiviseksi ja vapaasti käytettäväksi. Käymälä- ja
vesipistetiedot puuttuvat: sovellus näyttää ne tuntemattomina, ei puuttuvina
palveluina. Käyttäjät voivat lisätä päivättyjä vesihavaintoja kohdekortilla.

Ehdokkaat etsittiin 7.9.2026 valtakunnallisesta LIPAS-otoksesta, luokista
301 (laavu, kota tai kammi) ja 206 (tulentekopaikka). Puistorajan sisältä
löytyi tässä otoksessa yksi piste. Sen alkuperäinen tietue päivitettiin
24.9.2026. Tämä ei ole uusi koko LIPASin kattava haku: otoksen jälkeen lisätyt
kohteet voivat puuttua. Myöskään puistorajan ulkopuolisia Aarnikotkan metsän
kohteita tai muita palveluluokkia ei sisälly tähän tuontiin.

Lähteet ja lisenssit:

- LIPAS / Jyväskylän yliopisto, CC BY 4.0: https://api.lipas.fi/v2/sports-sites/73643
- Puistoraja KPU050034, Metsähallitus / Syke, jakelu GTK, CC BY 4.0:
  https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5
- Virallinen puistosivu: https://www.luontoon.fi/fi/kohteet/repoveden-kansallispuisto

`raw.json` sisältää lähdetietueen hakuajan, `sites.geojson` esikatselun,
`boundary.geojson` puistorajan ja `summary.json` haun rajauksen.
`kohteet.md` on hakuskriptin esikatselu, ei tietokannan ajantasainen tilanne.

## Toistaminen projektin juuresta

```powershell
.\retki.cmd backend preview:lipas-repovesi
.\retki.cmd backend test:repovesi-import
.\retki.cmd backend import:lipas-repovesi
```

Tuonti on rajattu tunnisteeseen 73643. PostGIS tarkistaa puistorajan ja
30 metrin läheisyydessä olevat mahdolliset kaksoiskappaleet. Uusintatuonti
säilyttää kohteen tunnisteen ja raportit. Koetuonnin raportti ja
käyttötilahavainto peruttiin transaktion mukana. Varsinainen tuonti tarkisti
raporttien sekä vesi- ja käyttötilahavaintojen sisältötiivisteiden säilymisen.
Puistosivujen yhdeksän testiä ja backendin koonti menivät läpi.
Tuontia ei ole ajastettu. OpenStreetMap-täydennystä ei tehty tässä vaiheessa.
