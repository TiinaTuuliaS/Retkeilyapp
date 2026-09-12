# Lemmenjoen OSM-täydennysten tarkistus

Haettu 12.9.2026. **Ei tietokantatuontia tai käyttöliittymämuutoksia.**

Hakulaatikossa oli 93 merkintää. Puistorajan sisälle osui 73 pistettä tai
aluekohteen hakulaatikkokeskipistettä: 45 taukopaikka-/tupamerkintää,
14 telttailupaikkaa, 13 luonnonlähdettä ja yksi muu veden saatavuusmerkinnän
sisältävä kohde. Yhdeksän sijaintia on alueen keskipisteitä, joiden koko geometria
on vielä tarkistettava. Kohdeluettelo: [lemmenjoki.md](lemmenjoki.md).

## Päällekkäisyydet nykyisten kohteiden kanssa

| Nykyinen LIPAS-kohde | Läheinen OSM-merkintä | Etäisyys |
| --- | --- | --- |
| Sotkajärven puolilaavu | Sotkajärvi laavu, node 4181161248 | noin 4 m |
| Juurakkojoen sääsuoja | Kota, node 4181161991 | noin 9 m |
| Kultahaminan sääsuoja | Kultasatama autiotupa, way 417638716 (keskipiste) | noin 36 m |

Sotkajärven ja Juurakkojoen merkinnät ovat todennäköisiä vastineita nykyisille
kohteille. Kultahaminassa nimi ja kohdelaji poikkeavat: kyse voi olla saman
kokonaisuuden eri rakenteista. Mitään näistä ei tuoda uutena automaattisesti.
Etäisyys ei yksin todista vastaavuutta. Lähellä on myös tulipaikkoja.

## Pieni seuraava tuontiehdotus: kolme tulipaikkaa

| Kohde ja lähde | Leveysaste, pituusaste |
| --- | --- |
| [Pajuoja tulipaikka](https://www.openstreetmap.org/node/4176627279) | 68.4558865, 25.9342895 |
| [Pitkäniemi](https://www.openstreetmap.org/node/4181473143) | 68.6741807, 25.9425217 |
| [Kapsuoja](https://www.openstreetmap.org/node/4181554783) | 68.6510477, 25.8316723 |

Kaikki kolme ovat nimettyjä pisteitä puistorajan sisällä ja niillä on
`leisure=firepit`. Ne eivät ole nykyisten kolmen LIPAS-kohteen lähellä.
Niiden tageissa ei ole nimenomaista käyttö- tai varausrajoitusta; tämä ei
vahvista nykyistä käyttöoikeutta tai toimintakuntoa. Lähdemuokkaukset ovat
vuosilta 2016 ja 2020.

Pitkäniemellä ja Kapsuojalla on lähellä myös telttailupaikkatietue.
Ensimmäisessä tuonnissa käytettäisiin vain tulipaikan tietuetta yhtenä
kohdekorttina. Telttailupaikan käymälä- ja vesimerkintöjä ei siirrettäisi siihen
automaattisesti. Varaus- ja vuokratuvat, nimettömät rakenteet sekä aluekohteet
jäävät jatkotarkistukseen.

## Vesitiedot

13 erillistä vesikohdetta ovat kaikki `natural=spring`-luonnonlähteitä.
Hausta ei löytynyt puiston sisältä kaivo- tai hanapistettä. Kolmella lähteellä
on `drinking_water=yes`, mutta merkintä ei ole tuore tutkimus tai saatavuushavainto.
Telttailupaikkojen `drinking_water=yes/boil/no` ei anna vesipisteelle tarkkaa
sijaintia. Näitä merkintöjä ei muuteta automaattisesti kaivoiksi eikä käyttäjähavainnoiksi.

## Toistettavuus ja lisenssi

Projektin juuresta paikallinen yhteenveto ja vertailu:

```powershell
.\.tools\node-v22.23.2-win-x64\node.exe backend/scripts/summarize-osm-lemmenjoki.cjs
.\.tools\node-v22.23.2-win-x64\node.exe backend/scripts/review-osm-lemmenjoki.cjs
```

Verkkohaku: `backend/scripts/preview-osm-lemmenjoki.cjs` projektin Nodella.
Raakadata ja kysely ovat `lemmenjoki-raw.json`- ja `lemmenjoki.overpass`-tiedostoissa.
Koneellinen vertailu: `lemmenjoki-review.json`. Kolmen kohteen ehdotus:
`lemmenjoki-proposal.geojson`. Vertailu koskee tallennettua LIPAS-otosta;
ennen varsinaista tuontia tarkistetaan myös senhetkinen tietokanta.

© OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
OSM-raakadata ja siitä johdetut luettelot sekä GeoJSONit ovat ODbL-aineistoa.
Puistoraja on erillistä Metsähallitus/Syke-aineistoa GTK:n jakelusta, CC BY 4.0.
LIPAS-tietueisiin ei yhdistetty OSM-kenttiä.
