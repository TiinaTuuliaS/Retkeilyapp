# Seitsemisen ja Helvetinjärven rajatun OSM-tuonnin tarkistus

Tarkistettu 12.9.2026. Tarkistuksen jälkeen käyttäjän hyväksymät kahdeksan
kohdetta tuotiin kehitystietokantaan samana päivänä. Seitsemisen API palauttaa
nyt viisi kohdetta ja Helvetinjärven kolme. Alkuperäisen koneellisen
tarkistusraportin `databaseChanged: false` kuvaa tarkistusajoa, ei myöhempää tuontia.

## Ensimmäiseen kokeiluun ehdotettavat 8 kohdetta

Kaikki ovat OSM:n pistekohteita paikallisen puistorajan sisällä. Koordinaatit
ovat lähteen pisteitä, eivät alueiden keskipisteistä arvioituja sijainteja.

| Puisto | Kohde ja lähde | Tyyppi | Leveysaste, pituusaste |
| --- | --- | --- | --- |
| Seitseminen | [Honkaniemi](https://www.openstreetmap.org/node/521874136) | Taukopaikka, tulentekomerkintä | 61.9313035, 23.4170285 |
| Seitseminen | [Liesijärvi](https://www.openstreetmap.org/node/521874512) | Laavu | 61.9293382, 23.4744060 |
| Seitseminen | [Haukilammen tulentekopaikka](https://www.openstreetmap.org/node/4337467394) | Tulipaikka | 61.9219584, 23.3956951 |
| Seitseminen | [Saari-Soljasen tulentekopaikka](https://www.openstreetmap.org/node/10591569867) | Tulipaikka | 61.9015568, 23.4694271 |
| Seitseminen | [Nimetön kaivo](https://www.openstreetmap.org/node/6583581389) | Kaivo | 61.9139335, 23.3831882 |
| Helvetinjärvi | [Valkoinen](https://www.openstreetmap.org/node/534951519) | Tulipaikka; kuvauksen mukaan ei laavua | 61.9830296, 23.8769617 |
| Helvetinjärvi | [Ruokejärvet](https://www.openstreetmap.org/node/2312895980) | Telttailupaikka, tulentekomerkintä | 61.9923698, 23.8934952 |
| Helvetinjärvi | [Nimetön kaivo](https://www.openstreetmap.org/node/3646381763) | Kaivo Haukanhiedan alueella | 62.0295880, 23.8030546 |

Nimettömien kaivojen näyttönimet ovat toimituksellisia, eivät OSM:n paikannimiä.
Näiden kahdeksan lähdemerkinnöissä ei ole nimenomaista käyttö- tai varausrajoitusta.
Tämä ei vahvista nykyistä käyttöoikeutta, maksuttomuutta tai toimintakuntoa.

## Vesitiedon esittäminen

Seitsemisen kaivolla ei ole juomakelpoisuusmerkintää. Helvetinjärven kaivolla
on `drinking_water=yes`, mutta se ei ole tuore vedenlaatututkimus eikä käyttäjän
havainto. Kaivojen OSM-muokkauspäivät ovat vastaavasti 2.7.2019 ja 15.7.2024;
muokkauspäivä ei kerro maastotarkastuksen päivää.

Tuonnissa veden tämänhetkinen saatavuus on **ei havaintoja**. Käyttäjähavainnot
tallennetaan erikseen päivämäärineen. Saatavuushavainto ei vahvista juomakelpoisuutta.

## Miksi muut merkinnät jäivät odottamaan?

- Kirkas-Soljasen keittokatos on merkitty varattavaksi. Pitkäjärven vuokratupa
  ja Kortesalon leirikoulutila ovat maksullisia ja varauksen vaativia.
- Helvetinkolun katos, päivätupa ja tulipaikka ovat lähellä toisiaan.
  Haukanhiedalla ja Iso Ruokejärvellä on samoin useita rakenteita samassa
  kokonaisuudessa. Ennen tuontia ratkaistaan, mitkä kuuluvat samaan kohdekorttiin.
- Alueina piirrettyjen kahdeksan kohteen täydet geometriat haettiin.
  Kaikki niiden kärkipisteet ovat puistorajan sisällä. Tämä ei ole koko
  polygonin kattavuustesti eikä vahvista sisäänkäynnin tai markerin sijaintia.
- Piknikpöydät ovat palvelurakenteita. Luonnonlähteitä ei nimetä hoidetuiksi
  vesipisteiksi. Nimettömät rakenteet vaativat vielä kohdistuksen.

Läheisyys ei yksin todista kaksoiskappaletta. Myöskään samankaltainen nimi
ei riitä yhdistämiseen: Ruokejärvet ja Iso Ruokejärvi ovat eri sijainneissa.

## Toistettavuus ja seuraava toteutusvaihe

Koneellinen ehdotus, sivuun jätetyt merkinnät, alle 60 metrin etäisyysparit
ja geometriatarkistukset ovat [import-review.json](import-review.json)-tiedostossa.
Sen voi muodostaa projektin juuresta:

```powershell
.\.tools\node-v22.23.2-win-x64\node.exe backend/scripts/review-osm-import.cjs
```

Tuonti ja uusintatuonti on toteutettu skriptissä `backend/scripts/import-osm-pilot.ts`.
Kohdekortit näyttävät lähteen ja aineistolatauksen. Kaivoista voi kirjata
päivätyn saatavuushavainnon. Katso [ajo-ohje ja tarkistustulokset](imported.md).

Aineisto: © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).
Tämä luettelo ja koneellinen tarkistus ovat OSM-aineistosta johdettuja.
OSM-kohteet tuotiin erillisiksi lähteeseen sidotuiksi kohteiksi, eikä niiden
kenttiä yhdistetty LIPAS-kohteisiin. OSM-osuus on ladattavissa ODbL-aineistona.
Pelkkä erillinen lähdetaulu ei ratkaise myöhemmän aineistojen yhdistämisen lisenssivelvoitteita.
