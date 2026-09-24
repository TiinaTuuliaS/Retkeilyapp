# Repoveden OSM-täydennys

Haettu ja tarkistettu 24.9.2026. Rajaus on Repoveden kansallispuiston
KPU050034 virallinen puistoraja, sama kuin LIPAS-tuonnissa.

Hakulaatikossa löytyi 70 OSM-merkintää. Näistä 15 pistettä tai alueen
hakulaatikkokeskipistettä osui puistorajan sisälle ja 55 ulkopuolelle.
Ulkopuolisia ei tuotu: osa Repoveden retkeilykokonaisuudesta sijaitsee
kansallispuiston rajan ulkopuolella, esimerkiksi Aarnikotkan metsässä.
Tämä rajaus ei ole kaikkien Repoveden retkeilykohteiden inventointi.

## Tuodut kohteet

Tuotu 24.9.2026. Paikalliset tunnisteet: Lojukoski 246, Lojukosken kaivo 247.
Repoveden puistosivulla on nyt yhteensä kolme kohdetta.

| Kohde | OSM-tunniste | Sovelluksen tyyppi | Peruste |
| --- | --- | --- | --- |
| Lojukoski | [node 1350040125](https://www.openstreetmap.org/node/1350040125) | Taukopaikka | Nimetty `tourism=picnic_site`, `access=yes`, `fireplace=yes` |
| Lojukosken kaivo | [node 2185581285](https://www.openstreetmap.org/node/2185581285) | Vesipiste | Nimetty `amenity=drinking_water`, `access=yes`, `fee=no` |

Molemmat ovat OSM:n varsinaisia pisteitä, eivät alueiden keskipisteitä.
Molempien lähdemuokkaus on 17.1.2024; tuore hakuaika ei tarkoita tuoretta
maastohavaintoa. Kaivolle tuodaan sijainti ja lähteen nimi. Veden saatavuutta
tai juomakelpoisuutta ei vahvisteta eikä käyttäjähavaintoa luoda automaattisesti.
Kaivo on erillinen kohde noin 95 metrin päässä taukopaikasta.

## Muut 13 merkintää

- Kirnukankaan OSM-laavu on noin 31 metrin päässä LIPAS-laavusta ja näyttää
  samalta kohteelta. Sitä ei tuotu uudelleen eikä lähteitä yhdistetty.
- Kirnukankaan telttailupaikka, tulipaikat ja käymälä jäivät erillisrakenteina
  tarkistukseen. Käymälätietoa ei siirretty LIPAS-kortille automaattisesti.
- Lojukosken telttailupaikka ja lähellä oleva erillinen tulipaikka jäivät pois,
  jotta taukopaikkakokonaisuus ei monistu korteiksi. Niiden palvelutageja
  ei siirretty taukopaikalle.
- Lojukosken varauskota on aluekohde; sen tarkka geometria ja varausehdot
  edellyttävät erillistä tarkistusta. Sen läheinen `access=customers`-tulipaikka
  ja kaksi pöytää jätettiin pois.
- Nimetön taukopaikka 2723107183 jäi nimensä ja kohdeidentiteettinsä osalta
  tarkistukseen. Käymälän `drinking_water=no` ei ole kaivon nykytilahavainto.

## Toistaminen

```powershell
.\retki.cmd backend preview:osm-repovesi
.\retki.cmd backend summarize:osm-repovesi
.\retki.cmd backend test:osm-repovesi
.\retki.cmd backend import:osm-repovesi
```

Tuonti on rajattu kahteen tarkistettuun lähdetunnisteeseen. Esikatselun
päivittäminen ei automaattisesti laajenna tuontia. Tuonti tarkistaa alkuperäiset
tagit ja pisteet, käyttörajoitukset, puistorajan sekä tietokannan mahdolliset
kaksoiskappaleet 30 metrin säteellä. Koetuonti testasi uusintatuonnin, pysyvät
tunnisteet ja kaikkien kolmen havaintolajin säilymisen; testimuutokset peruttiin.
Varsinainen tuonti vertasi havaintojen sisältötiivisteitä ennen ja jälkeen.
Tuontia ei ole ajastettu.

Raakadata: `repovesi-raw.json`, kysely: `repovesi.overpass`, koko esikatselu:
`repovesi.geojson` ja `repovesi.md`, vertailu: `repovesi-review.json`,
hyväksytyt kohteet: `repovesi-proposal.geojson`. Vertailun
`databaseChanged: false` kuvaa esikatseluvaihetta ennen tuontia.

© OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
Raakadata ja siitä johdetut luettelot sekä GeoJSONit ovat ODbL-aineistoa.
Kohdekortit näyttävät lähteen ja lisenssin, ja tuodut kohteet sisältyvät
`/locations/osm.geojson`-vientiin. Puistoraja on erillistä Metsähallitus/Syke-
aineistoa GTK:n jakelusta (CC BY 4.0). LIPAS-tietueita ei muutettu.
