# Suolijärven lähikohteiden rajattu tuonti

12.9.2026 tuotiin kaksi LIPAS-kohdetta yhteiselle kartalle ja kohdeluetteloon.
Kohteille ei ole omaa aluesivua tai aluekorttia. Kansallispuistosivut säilyvät ennallaan.

| Kohde | LIPAS-tunniste | Kehitystietokannan ID |
| --- | --- | --- |
| Särkijärven retkeilyalue – Suoliojan nuotiopaikka | 607250 | 96 |
| Särkijärven retkeilyalue – Vuoreksenrannan nuotiopaikka | 609066 | 97 |

Molemmat ovat Särkijärven rannalla Suolijärven lähistöllä. Nimessä säilyy
LIPAS-lähteen paikannimi. Löydät kohteet etusivun nimihakua käyttämällä:
`Suoliojan` tai `Vuoreksenrannan`. Kortin valinta keskittää kartan kohteeseen.
Yleinen raportointi ja vesipistehavaintojen lisääminen käyttävät nykyisiä lomakkeita.

LIPAS-vastaukset haettiin 12.9.2026. Kummankin lähdemuokkaus on 11.6.2024:
uusi haku ei siis tarkoita tuoretta maastohavaintoa. Molemmat on merkitty
aktiivisiksi ja vapaasti käytettäviksi. Käymälästä ja vesipisteestä ei ole
palvelumerkintää; käyttöliittymä näyttää niistä ”Ei tietoa”.

Lähteet: [Suolioja](https://api.lipas.fi/v2/sports-sites/607250) ja
[Vuoreksenranta](https://api.lipas.fi/v2/sports-sites/609066).
Tampereen kaupungin [Suolijärven reittikuvaus](https://www.tampere.fi/luonto-ja-ymparisto/luonnossa-liikkuminen/luontopolut/suolijarven-luontopolku)
toimii taustatietona, eikä sen sisältöä tuotu kohdeaineistoksi.

## Toistaminen

Projektin juuresta:

```powershell
.\retki.cmd backend preview:suolijarvi
.\retki.cmd backend test:suolijarvi-import
.\retki.cmd backend import:lipas-suolijarvi
```

Esikatselu hakee kaksi LIPAS-vastausta ja rajatun OSM-otoksen. Se ei muuta
tietokantaa. Tuonti käyttää vain kahta nimettyä LIPAS-tietuetta. Se ei ole ajastettu.
Tuonti tarkistaa aktiivisuuden, kohdelajin, kunnan ja sijainnin tutkimusrajauksessa.
Uusintatuonti päivittää saman lähdetunnisteen kohdetta. Uusi kohde alle 30 metrin
päässä olemassa olevasta kohteesta vaatii tarkistuksen ja pysäyttää tuonnin.

Koetuonnissa varmistettiin uusintatuonnin kohdemäärä, pysyvät tunnisteet ja
raportin säilyminen lähdenimen muuttuessa. Testimuutokset peruttiin transaktiolla.
Varsinaisessa tuonnissa raporttien ja vesihavaintojen sisältötiivisteet säilyivät.

## OSM-esikatselu

`osm-raw.json` on erillistä © OpenStreetMap contributors
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) -aineistoa.
Siitä ei tuotu mitään tietokantaan eikä yhdistetty kenttiä LIPAS-kohteisiin.
Haun suorakulmio ei ole virallinen retkeilyalueen raja.
Tuloksissa on samoihin taukopaikkoihin liittyviä rakenteita, pöytiä,
bussikatoksia, yksityinen kohde ja muita tulipaikkamerkintöjä.
Niitä ei tulkita automaattisesti ylläpidetyiksi retkikohteiksi.
