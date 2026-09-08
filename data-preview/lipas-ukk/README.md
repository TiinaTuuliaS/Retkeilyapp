# UKK-kansallispuiston LIPAS-esikatselu

Esikatselu tehty 8.9.2026 ilman tietokantamuutoksia. Sen jälkeen 33 puiston
sisäistä kohdetta päivitettiin LIPASista ja tuotiin kehitystietokantaan 8.9.2026.
Kohteet ovat 7.9.2026 tallennetusta koko Suomen LIPAS-otoksesta, eivät uusi verkkohaku.

## Tulos

- Tallennetun puistorajan sisällä 33 kohdetta: 27 luokassa 301 (laavu, kota tai kammi)
  ja 6 luokassa 206 (ruoanlaitto-/tulentekopaikka).
- Kaikki 33 ovat lähteessä aktiivisia. Tämä ei vahvista nykyistä kuntoa.
- Laajennetussa hakulaatikossa lisäksi 25 puiston ulkopuolista kohdetta.
- Rakenteista vesipistetietoa ei löytynyt puiston sisäisiltä kohteilta.
- Käymälä on lähteen mukaan 31 kohteella; kahdella siitä ei ole tietoa.
- Tarkat palveluarvot ja kaikki nimet: [kohdeluettelo](kohteet.md).

Tämä ei ole luettelo puiston kaikista retkipalveluista. Esimerkiksi autio- ja
varaustupia ei haettu näillä kahdella tyyppikoodilla. UKK-testilaavu ei kuulu otokseen.
Puuttuva palvelutieto tarkoittaa "ei tietoa", ei palvelun puuttumista.

## Aluerajaus ja lähteet

Puiston raja haettiin 8.9.2026 [GTK:n jakamasta luonnonsuojelualueaineistosta](https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5).
Tuottaja Metsähallitus / Syke, jakelija GTK, lähdekuvauksen lisenssi
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Aluetunnus `KPU120026`, nimi Urho Kekkosen kansallispuisto.
Aineiston MuutosPvm on 17.3.2025: hakupäivä ei takaa rajan ajantasaisuutta.
Alkuperäinen kerroskuvaus säilyy tiedostossa `boundary-layer.json` ja
EPSG:4326-rajageometria tiedostossa `boundary.geojson`.
Hakuehto: `Nimi LIKE '%Kekkos%'`, `outFields=*`, `outSR=4326`, `f=geojson`.

Kohteiden lähde on [LIPAS API V2](https://api.lipas.fi/), Jyväskylän yliopisto.
Alkuperäisen haun rajaukset ja rajoitukset: [Suomen esikatselu](../lipas-finland/README.md).

Pisteitä verrataan moniosaiseen puistorajaan, myös polygonien reiät huomioiden.
Täsmälleen rajalle osuvat pisteet merkitään tarkistettaviksi. Koordinaattien
maastotarkkuutta ei varmennettu; rajan lähellä olevat kohteet on hyvä tarkistaa
ennen lopullista tuontivalintaa. Ulkopuolisten hakulaatikko on rajan äärikoordinaatit
laajennettuna 0,3 pituusasteella ja 0,15 leveysasteella kumpaankin suuntaan.
Se ei ole kiinteän kilometrimäärän lähialue eikä puistoon kuulumisen ehto.

## Tiedostot ja toistaminen

- `sites.geojson`: 58 pistettä ja sijaintiluokittelu.
- `summary.json`: määrät, rajaus ja lähdeaikaleimat.
- `kohteet.md`: luettava taulukko.

```powershell
.\retki.cmd backend preview:lipas-ukk
```

Komento laskee esikatselun uudelleen samoista paikallisista lähdetiedostoista.
Se ei päivitä lähteitä verkosta eikä kirjoita tietokantaan. Se tarkistaa tunnisteet
sekä pisteen sisä-, ulko-, reuna- ja reikätapaukset ennen tulosten kirjoittamista.

## Rajattu tuonti sovellukseen

```powershell
.\retki.cmd backend fetch:lipas-ukk
.\retki.cmd backend test:lipas-ukk-import
.\retki.cmd backend import:lipas-ukk
```

Haku hyväksyy vain esikatselun 33 sisäpuolista tunnistetta. Kohteen täytyy olla
aktiivinen, ja tyypin sekä koordinaattien on vastattava tarkistettua otosta.
Muutos pysäyttää haun uutta tarkistusta varten. Vasta kaikkien kohteiden
tarkistuksen jälkeen syntyy `import.geojson`. Alkuperäisvastaukset tallentuvat
paikalliseen, Gitistä ohitettuun `fetches`-kansioon.

Tuonti käyttää LIPAS-tunnisteita: uusintatuonti päivittää saman kohteen eikä luo
kaksoiskappaleita. Raportteja ei muuteta. Testikomento testaa uusintatuonnin ja
raporttiviittauksen oikeassa tietokannassa ja peruu testimuutokset lopuksi.
Tuonti on yksi transaktio: virhe peruu koko erän. Hakua ei ole ajastettu.
Luokka 301 näkyy frontendissä nimellä "Laavu, kota tai kammi".

UKK laavu testi (id 4) sekä sen kaksi raporttia poistettiin käyttäjän pyynnöstä.
Poistoa edeltävä varmuuskopio on paikallisessa `.repo-backups`-kansiossa.
Nuuksion kohteet ja niiden raportit säilyivät.
