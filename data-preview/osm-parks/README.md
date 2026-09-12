# OpenStreetMap: puistojen vesipisteet ja taukopaikat

Haettu 12.9.2026. Laaja esikatselu; siitä **kahdeksan tarkistettua kohdetta
tuotiin kehitystietokantaan** samana päivänä. [Tuonnin tiedot](imported.md).
Lähde © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
Tämän kansion OSM-raakadata ja siitä johdetut GeoJSONit sekä kohdeluettelot
ovat ODbL-aineistoa. [Lähdemerkintä- ja lisenssiohje](https://www.openstreetmap.org/copyright).

## Löydökset tallennettujen puistorajojen sisältä

| Puisto | Erilliset kaivo-/lähdepisteet | Muut tarkistetut kohteet |
| --- | --- | --- |
| UKK | 109 luonnonlähdettä | Taukopaikkoja ei haettu kattavasti; mukaan tuli myös kohteita, joilla on drinking_water-ominaisuus |
| Seitseminen | 1 kaivo ja 2 lähdettä | 19 taukopaikka-/rakennetietuetta, 3 telttailualuetietuetta, 7 pöytää, 1 muu kohde veden saatavuusmerkinnällä |
| Helvetinjärvi | 1 kaivo | 16 taukopaikka-/rakennetietuetta, 2 telttailualuetta, 1 pöytä |

Tietueiden lukumäärä **ei ole erillisten taukopaikkojen lukumäärä**.
Samasta taukopaikasta voi olla erikseen esimerkiksi tulipaikka, katos ja
telttailualue. Kaikkia shelter-kohteita ei saa nimetä laavuiksi. Luonnonlähteitä
ei pidä esittää huollettuina vesipisteinä tai vahvistettuina juomavesipaikkoina.

Seitsemisen esimerkkejä: Haukilammen tulentekopaikka, Liesijärven laavu,
Kirkas-Soljasen ja Saari-Soljasen keittokatokset.
Helvetinjärven esimerkkejä: Helvetinkolu, päivätupa, Valkoinen ja Haukanhiedan
alueen rakenteet. Aluekohteista tallennettiin tässä vain Overpassin
hakulaatikkokeskipiste, ei rakennuksen tarkkaa sijaintia tai sisäänkäyntiä.

## Vesipisteiden tiedot

- [Seitsemisen nimetön kaivo](https://www.openstreetmap.org/node/6583581389):
  61.9139335 N, 23.3831882 E. OSM-muokkaus 2.7.2019. Ei drinking_water- eikä
  havaintopäivämerkintää. Kaivoa ei nimetty tässä esimerkiksi Kortesalon kaivoksi,
  koska OSM-tietue ei anna nimeä eikä vastaavuutta ole varmennettu.
- [Helvetinjärven nimetön kaivo](https://www.openstreetmap.org/node/3646381763):
  62.029588 N, 23.8030546 E. OSM-muokkaus 15.7.2024, drinking_water=yes.
  Sijaitsee Haukanhiedan alueella, mutta tietueella ei ole nimeä.
- Seitsemisen kahdella lähteellä ei ole drinking_water-merkintää.
- UKK:n 109 lähteestä kymmenellä on drinking_water=yes; muilta merkintä puuttuu.

**Muokkausaika ei ole käyntipäivä eikä veden laadun tutkimuspäivä.**
Saatavuutta tänään ei vahvistettu millekään pisteelle. drinking_water=yes
on karttatietokannan merkintä, ei tässä selvityksessä saatu laatutodistus.
Alkuperäiset access-, seasonal-, disused- ja muut tagit säilyvät GeoJSONissa;
niiden perusteella käyttörajoitukset ja elinkaaritila pitää tarkistaa ennen tuontia.

## Tiedostot

- [UKK](ukk.md), [Seitseminen](seitseminen.md), [Helvetinjärvi](helvetinjarvi.md):
  nimet, lähdelinkit, koordinaatit, tyyppitiedot ja päiväykset.
- `*-raw.json`: vastaukset, hakuajat, palvelin ja kysely; muokkaajien käyttäjänimet
  ja käyttäjätunnisteet on jätetty pois.
- `*.geojson`: esikatselupisteet, kaikki tagit ja rajausluokittelu.
- `summary.json`: määrät ja OSM-palvelimen aineistoaikaleima.
- `*.overpass`: toistettavat kyselyt.

Haku tehtiin puistojen rajojen äärikoordinaattien suorakulmioista.
Tulokset luokiteltiin paikallisia Metsähallitus/Syke-rajoja vasten huomioiden
polygonien reiät. Alueiden keskipisteluokittelu vaatii tarkistuksen koko
geometriasta ennen lopullista tuontia. Puistorajat eivät ole OSM-aineistoa;
niiden lähteet ja päiväykset ovat vastaavissa `lipas-*`-kansioissa.

Kysely kattaa amenity=drinking_water, man_made=water_well/water_tap,
natural=spring ja drinking_water-merkinnät. Kahdessa eteläisessä puistossa
haettiin myös shelter, picnic_site, firepit, bbq, wilderness_hut, camp_site
ja picnic_table. Poikkeavasti tai pelkästään elinkaarietuliitteellä merkityt
kohteet voivat jäädä hausta pois; kattavuutta ei luvata.

Ensimmäiset palvelimet palauttivat HTTP 429/406. Onnistuneet vastaukset saatiin
[OSM:n dokumentoimalta](https://wiki.openstreetmap.org/wiki/Overpass_API)
VK Mapsin Overpass-palvelimelta. Palvelinvirhe ei merkitse tyhjää aineistoa.

```powershell
.\retki.cmd backend preview:osm-parks
.\retki.cmd backend summarize:osm-parks
```

Ensimmäinen hakee verkosta ja korvaa onnistuneen puistohaun paikallisen otoksen.
Toinen muodostaa luettelot paikallisista otoksista. Kumpikaan ei käytä tietokantaa.
[Seitsemisen ja Helvetinjärven tuontitarkistus](import-review.md) rajaa
ensimmäiseen kokeiluun kahdeksan pistekohdetta. Nämä on tuotu tietokantaan;
muut tämän kansion esikatselukohteet eivät näy sovelluksessa.

OSM-kohteiden lähdemerkinnät ja ODbL-aineistolataus ovat mukana sovelluksessa.
Tuonti ei yhdistä OSM-kenttiä LIPAS-kohteisiin. Jos myöhemmin yhdistetään samaa
paikkaa kuvaavia eri lähteiden tietoja, arvioidaan yhdistelmän lisenssivelvoitteet
erikseen. Aluekohteiden sijainnit ja samaan kohteeseen kuuluvat rakenteet vaativat
edelleen tarkistuksen ennen esikatselua laajempaa tuontia.
