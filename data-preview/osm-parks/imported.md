# Rajattu OSM-tuonti 12.9.2026

Kehitystietokantaan lisättiin kahdeksan kohdetta, ei koko esikatselua:

| Puisto | Kohde | Kehitystietokannan ID |
| --- | --- | --- |
| Seitseminen | Honkaniemi | 86 |
| Seitseminen | Liesijärvi | 87 |
| Seitseminen | Haukilammen tulentekopaikka | 88 |
| Seitseminen | Nimetön kaivo (Seitseminen) | 89 |
| Seitseminen | Saari-Soljasen tulentekopaikka | 90 |
| Helvetinjärvi | Valkoinen | 91 |
| Helvetinjärvi | Ruokejärvet | 92 |
| Helvetinjärvi | Nimetön kaivo (Helvetinjärvi) | 93 |

Numerot ovat tämän ympäristön tunnisteita. Uusintatuonti käyttää pysyvää
OSM-tunnistetta (`source=osm`, `source_collection=node`, `source_id`).

## Käyttö

Projektin juuresta, nykyisen tietokannan ollessa käynnissä:

```powershell
.\retki.cmd backend test:osm-import
.\retki.cmd backend import:osm-pilot
```

Testikomento peruu kaikki testitietojen muutokset transaktion lopuksi.
Tietokannan juokseviin numerotunnisteisiin voi silti jäädä aukkoja.
Tuontikomento lisää tai päivittää samat kahdeksan kohdetta paikallisesta
12.9.2026 otoksesta. Se ei hae verkosta eikä ole ajastettu.

Tuonti tarkistaa OSM-raakadatan vastaavuuden, tarkan kohdelistan ja PostGISillä
sijainnit puistorajojen sisällä. Uusi kohde alle 30 metrin päässä olemassa
olevasta kohteesta pysäyttää tuonnin tarkistusta varten; läheisyys ei yksin
todista kaksoiskappaletta. Monen lähteen yhteiseksi muutettua kohdetta ei päivitetä
automaattisesti. Virhe peruu koko tuonnin.

## Käyttöliittymä ja havainnot

Puistosivut näyttävät viisi ja kolme kohdetta. Kaivokortilla on
**Kerro kaivon veden saatavuudesta** -painike, käyntipäivä ja saatavuusvalinta.
Kaivon tyyppi on valmiina. Lisätieto kirjataan nykyisen vesihavaintomallin
`directions`-kenttään. Havainnot kohdistuvat kaivon omaan `location_id`:hen.
Yleinen kuntoraportti säilyy erillisenä arviona kohteen yleiskunnosta.

OSM:n kaivomerkinnästä ei päätellä veden tämänhetkistä saatavuutta,
kausikäyttöä tai juomakelpoisuutta. Molemmilla kaivoilla oli tuonnin jälkeen
nolla vesihavaintoa. Tuonti ei luo käyttäjähavaintoja.

## Lähteet ja aineiston lataus

Kohdekortti näyttää OSM-kohdelinkin, © OpenStreetMap contributors -merkinnän,
ODbL-lisenssin sekä aineistolatauksen:
`GET http://localhost:3000/locations/osm.geojson`.
Rajapinta palauttaa tuodun OSM-osuuden nimineen, tyyppeineen, koordinaatteineen,
alkuperäisine tageineen ja lähdepäiväyksineen. Se ei sisällä käyttäjähavaintoja
tai käyttäjätunnisteita. OSM-perustietueita ei yhdistetä LIPAS-tietueisiin tässä tuonnissa.

OSM: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) ja
[lähdemerkintäohje](https://www.openstreetmap.org/copyright).
Lähteiden myöhempi kenttäkohtainen yhdistäminen voi muuttaa aineiston
lisenssivelvoitteita; lähdemerkintöjen säilyttäminen ei yksin ratkaise sitä.

## Tarkistukset

- PostgreSQL-koetuonti: samat tunnisteet ja kohdemäärä uusintatuonnissa,
  lähdenimen päivitys sekä raportin ja vesihavainnon säilyminen.
- Varsinainen tuonti: raporttien ja vesihavaintojen sisältötiivisteet ennallaan.
- Käynnissä oleva API: Seitseminen 5, Helvetinjärvi 3, OSM-vienti 8.
- Backendin palvelutietojen, vesihavaintojen ja puistosivujen testit sekä
  frontendin ja backendin käännökset.
- Selaimen automaattista käyttötestiä ei voitu tehdä: selainyhteyttä ei ollut saatavilla.
