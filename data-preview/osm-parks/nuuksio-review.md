# Nuuksion OSM-täydennys

Haettu ja tuotu 25.9.2026. Hakulaatikossa oli 190 merkintää. Nuuksion
kansallispuiston rajan KPU010030 sisälle osui 64 pistettä tai alueen keskipistettä:
35 taukopaikka-/tupamerkintää, 14 telttailualuetta, 4 vesikohdetta, 8 pöytää
ja 3 muuta veden saatavuusmerkinnän sisältävää kohdetta. Kahdeksan sijaintia
oli alueiden hakulaatikkokeskipisteitä, joita ei tuotu pistekohteina.

## Tuodut 16 kohdetta

| Kohde | OSM-node | Sovelluksen ID |
| --- | --- | --- |
| Vesihana – Nuuksio | 649291366 | 264 |
| Saarilammen telttailualue | 915621349 | 265 |
| Valkealammen telttailualue | 1167723425 | 266 |
| Kattilan keittokatos | 1167723450 | 267 |
| Vääräjärven telttailualue | 1167723519 | 268 |
| Kattilan tulentekopaikka | 1167723549 | 269 |
| Haukanholman tulentekopaikka | 1167723560 | 270 |
| Iso-Holman tulentekopaikka | 1167723603 | 271 |
| Valkialammen telttailualue | 1167723657 | 272 |
| Mustalammen pieni keittokatos | 1167723687 | 273 |
| Holma-Saarijärven läntinen tulentekopaikka | 1167723770 | 274 |
| Pöksynhaaran telttailualue | 1167723987 | 275 |
| Iso-Holman pieni tulentekopaikka | 1167724010 | 276 |
| Urjan tulentekopaikka | 1167724046 | 277 |
| Mustalammen tulentekopaikka | 1167724100 | 278 |
| Kaivo – Nuuksio | 10970967697 | 279 |

Seitsemän tulentekopaikkaa, kaksi katosta, viisi telttailualuetta ja kaksi
vesipistettä. Kaikki ovat varsinaisia OSM-pisteitä puistorajan sisällä ja
yli 150 metrin päässä kahdesta LIPAS-laavusta. Tuonnissa tarkistettiin lisäksi
tietokannan kohteet 30 metrin säteellä. Läheisyys ei yksin todista samuutta.

## Vesitiedot ja nimet

Vesihana ja kaivo ovat nimettömiä OSM:ssa. Niiden nimet ovat sovelluksen
kuvailevia nimiä, eivät vahvistettuja paikannimiä (`name_generated=true`).
Vesihana on `amenity=drinking_water`, `man_made=water_tap`, `access=yes`.
Kaivo on `amenity=drinking_water`, `man_made=water_well`, `pump=manual`.
Lähde kertoo vesipisteen sijainnin, ei nykyistä saatavuutta tai juomakelpoisuutta.
Automaattisia käyttäjähavaintoja ei luotu. Sisätilan vesipiste 10980522678
ja luonnonlähde 2351501140 jäivät käyttömahdollisuuksien tarkistukseen.

OSM-muokkausajat vaihtelevat vuosista 2011–2026. Hakupäivä ei ole
maastotarkistuksen päivä. Varaus- tai maksumaininnan puuttuminen ei itsessään
vahvista nykyistä käyttöoikeutta. Lähde näkyy jokaisessa kohdekortissa.

## Pois jätetyt kokonaisuudet

Tietokannassa havaittiin tuonnin lopputarkistuksessa myös kolme lähteetöntä
kehityskohdetta (ID:t 1, 6 ja 7). Niiden sijainnit eivät osuneet 30 metrin
tarkistukseen. Vanha ID 6 on nimeltään Haukanholman tulentekopaikka mutta
selvästi eri sijainnissa kuin OSM-kohde 1167723560. Näitä ei yhdistetty tai
poistettu automaattisesti eikä vanhoja raportteja siirretty. Puistosivun
kattavuusteksti kertoo kolmesta varmentamattomasta kehityskohteesta.

- Takalan OSM-laavu on noin 2 metrin ja Holma-Saarijärven OSM-laavu noin
  30 metrin päässä LIPAS-vastineestaan. Laavuja ei tuotu uudelleen.
- Laavujen välittömät tulipaikat ja pöydät sekä Holma-Saarijärven itäinen
  telttailu-/tulipaikkakokonaisuus jätettiin tarkistukseen. Läntinen tulipaikka
  on selvästi erillinen piste kauempana LIPAS-laavusta.
- Telttailupaikkoja ei tuotu valittujen tulipaikkojen rinnalle samasta
  kokonaisuudesta. Telttailupaikan palvelutietoja ei siirretty tulipaikalle.
- Kattilan lähekkäiset tulipaikkamerkinnät edellyttävät vertailua: tässä
  tuotiin yksi nimetty tulentekopaikka ja erillinen nimetty keittokatos.
- Oravankolon, Tikankolon, Kattilankodan ja Kolmoislammen varaus-/vuokrakohteet
  sekä Oravankolon tulentekopaikka jäivät käyttöehtojen jatkotarkistukseen.
- Muut nimettömät rakenteet, aluekohteet, pöydät ja uimapaikat jäivät pois.
  Uimapaikan `drinking_water=no` ei ole vesipisteen tilahavainto.

Kaikki 64 esikatselukohdetta löytyvät tiedostosta `nuuksio.md` lähdelinkkeineen;
alkuperäiset tagit ja ulkopuoliset kohteet ovat `nuuksio.geojson`-tiedostossa.

## Toistaminen ja tarkistukset

```powershell
.\retki.cmd backend preview:osm-nuuksio
.\retki.cmd backend summarize:osm-nuuksio
.\retki.cmd backend test:osm-nuuksio
.\retki.cmd backend import:osm-nuuksio
```

Tuonti käyttää kiinteää 16 tunnisteen listaa ja `nuuksio-scope.json`-määrityksiä.
Haku ei laajenna tuontia automaattisesti. Alkuperäiset tagit, sijainnit, nimet,
kohdetyypit, käyttörajoitukset, puistoraja ja läheiset tietokantakohteet tarkistetaan.
Koetuonti varmisti uusintatuonnin, pysyvät ID:t ja kaikkien kolmen havaintolajin
säilymisen; testimuutokset peruttiin. Varsinainen tuonti tarkisti havaintojen
sisältötiivisteet ennen ja jälkeen. Tuontia ei ole ajastettu.

Raakadata ja hakuajat: `nuuksio-raw.json`; kysely: `nuuksio.overpass`;
vertailu: `nuuksio-review.json`; hyväksytyt kohteet: `nuuksio-proposal.geojson`.
Vertailun `databaseChanged:false` kuvaa esikatseluvaihetta, ei tuonnin lopputilaa.

© OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
OSM-raaka-aineisto ja siitä johdetut tiedostot ovat ODbL-aineistoa. Tuodut
kohteet sisältyvät `/locations/osm.geojson`-vientiin. Puistoraja on erillistä
Metsähallitus/Syke-aineistoa GTK:n jakelusta, CC BY 4.0. OSM-kenttiä ei
yhdistetty LIPAS-laavuihin.
