# Pallas–Yllästunturi: 18 kohdetta tuotu

12.9.2026 tuotiin 18 kohdetta kehitystietokantaan, tunnisteet 134–151.
Puistosivu: http://localhost:5173/#/parks/pallas

Hannukurun kota (LIPAS 603907, paikallinen ID 148) tuotiin merkinnällä
**Tilapäisesti pois käytöstä · LIPAS**. Kohdekortti ja listakortti näyttävät
sulkumerkinnän, karttapiste on ruskea. Lähteen muokkauspäivä on 26.3.2025.
Hakupäivä ei ole maastotarkastuksen päivä.

Kohdekortin **Kerro havainto käyttötilasta** -lomakkeella voi tallentaa
käyntipäivän, käyttötilan ja kuvauksen. Havainnot tallennetaan erilliseen
`usage_observations`-tauluun, eivätkä ne muuta LIPASin tilamerkintää.
Uusintatuonti voi päivittää lähdetilan, mutta säilyttää käyttäjähavainnot.
Demokäyttäjä on edelleen 1; kirjautumista ei ole vielä toteutettu.

Projektin juuresta uudessa ympäristössä:

```powershell
.\retki.cmd backend db:usage-observations
.\retki.cmd backend test:pallas-import
.\retki.cmd backend import:lipas-pallas
```

Tuonti käyttää kiinteää 18 tunnisteen listaa ja paikallista lähdeotosta.
Se ei ole ajastettu. Koetuonti peruu testimuutokset transaktiolla.
API: GET/POST `/locations/:id/usage-observations`; kentät `status`
(`in_use`, `not_in_use`, `unknown`), `comment` ja `observedOn`.
Ylimääräiset kentät ja tulevat tai virheelliset käyntipäivät hylätään.

PostGIS varmisti pisteet puistorajan sisälle. Koetuonti varmisti pysyvät tunnisteet,
raporttien säilymisen ja käyttötilahavainnon säilymisen lähdetilan rinnalla.
Käyttötilahavaintojen, palvelutietojen ja puistosivujen testit sekä molemmat
käännökset onnistuivat. API palautti 18 kohdetta ja Hannukurulle oikean sulkutilan.
Testihavaintoja ei jätetty tietokantaan. Visuaalista selaintestiä ei tehty.

Tuotu aineisto on [proposal.geojson](proposal.geojson)-tiedostossa.
Nammalakuru ja kaksi Kesänkijärven kohdetta jäivät tarkistettaviksi.
18 kohteesta 17:llä on käymälämerkintä; vesipistetieto puuttuu kaikilta.

## Alkuperäinen kartoitus ennen Hannukurun lisäämistä

Tarkistettu 12.9.2026. **Tietokantaa ja sovellusta ei muutettu.**
Kohdelista: [kohteet.md](kohteet.md).

Puistorajan sisältä löytyi 7.9.2026 valtakunnallisesta LIPAS-otoksesta
21 ehdokasta. Kaikkien 21 kohteen tiedot haettiin uudelleen LIPASista.
Niistä 20 on nyt aktiivisia ja yksi tilapäisesti pois käytöstä.

## Ehdotus ensimmäiseen tuontiin

Tuodaan **17 aktiivista laavu- ja kotakohdetta**. Jätetään pois:

- **603907 Hannukurun kota:** nykyinen LIPAS-tila on
  `out-of-service-temporarily`. Sitä ei saa tuoda toimivana kohteena.
- **600335 Nammalakurun autio- ja varaustupa:** nimi kuvaa tupakokonaisuutta,
  vaikka LIPAS-luokka on 301. Kohdelaji ja varaustiedot vaativat tarkistuksen.
  Pelkkää `free-use=true`-kenttää ei pidä esittää koko kokonaisuuden käyttöehtona.

- **73328 Kesänkijärven laavu ja 606088 Kesänkijärvi kota:** pisteet ovat noin
  32 metrin päässä toisistaan. Ne voivat olla eri rakenteita samalla taukopaikalla;
  ryhmittely tarkistetaan ennen tuontia, eikä niitä yhdistetä pelkän läheisyyden perusteella.

17 kohteen ehdotuksesta 16:lla on LIPASissa käymälämerkintä ja vapaa käyttö.
Villenkämpän laavun palvelukentät puuttuvat. Yhdelläkään ei ole vesipisteen
kausikäyttötietoa. Puuttuvat tiedot näytetään tuntemattomina; veden tämänhetkistä
saatavuutta tai juomakelpoisuutta ei päätellä aineistosta.

## Rajaus ja lähteet

- Puistoraja `KPU120022`, nimi Pallas-Yllästunturin kansallispuisto,
  lähteen muokkauspäivä 10.4.2025. Haettu 12.9.2026 WGS84-koordinaatistossa.
- Rajan lähde: [GTK:n jakama suojelualuerajapinta](https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5),
  Metsähallitus / Syke, CC BY 4.0.
- Kohteiden lähde: LIPAS `sports-sites`, luokat 301 ja 206. Tuoreiden
  kohdetietueiden lähdeosoitteet ja hakuajat ovat [raw.json](raw.json)-tiedostossa.
- Geometriat tarkistettiin puistorajan monikulmioita ja niiden reikiä vasten.
  Kaikki 21 pistettä ovat rajan sisällä, eivät rajaviivalla.
- Ehdokkaat poimittiin vanhemmasta valtakunnallisesta otoksesta. Sen jälkeen
  kokonaan lisätyt kohteet voivat puuttua, vaikka ehdokkaiden tiedot päivitettiin.
  Tämä ei ole kaikkien puiston tupien, tulipaikkojen tai vesipisteiden inventointi.

LIPAS riittää tähän ensimmäiseen rajattuun tuontiin. OSM-täydennyksiä ei vielä
haettu; vesipisteiden ja muiden puuttuvien palveluiden kartoitus jää seuraavaan vaiheeseen.

## Toistaminen

Projektin juuresta:

```powershell
.\.tools\node-v22.23.2-win-x64\node.exe backend/scripts/preview-lipas-pallas.cjs
```

Komento päivittää tämän kansion esikatselun. Se ei käytä tietokantaa.
`summary.json`-tiedoston `eligible=20` tarkoittaa teknisesti aktiivisia
pistekohteita; käsin tarkistettu ehdotus on 17 Nammalakurun ja Kesänkijärven kohteiden poissulun jälkeen.
Varsinaisessa tuonnissa tarkistetaan vielä nykyisen tietokannan päällekkäisyydet
ja käytetään pysyviä LIPAS-tunnisteita. Puistolle voidaan samalla tehdä oma sivu
nykyisten kansallispuistosivujen mallilla.
