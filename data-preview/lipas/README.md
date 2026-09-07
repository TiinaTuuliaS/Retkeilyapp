# Nuuksion kahden laavun aineistokokeilu

[Koko Suomen taukopaikkojen ja palvelutietojen esikatselu](../lipas-finland/README.md) on nyt saatavilla.

[Vesipisteiden saatavuuden jatkoselvitys ja valmis aineistokysely](../../docs/vesipisteet-ja-aineistopyynto.md).

Haettu LIPAS API V2:sta 7.9.2026 noin klo 13.04 Suomen aikaa.
Tämä kansio sisältää erillisen aineisto-otoksen. Sovellus ei lue sitä automaattisesti.
Rajattu `import:lipas-preview`-komento tuo nämä kaksi kohdetta tietokantaan.

## Mitä tiedostoja tässä on?

- `73487.json`: Takalan laavun alkuperäinen API-vastaus.
- `73851.json`: Holma-Saarijärven laavun alkuperäinen API-vastaus.
- `nuuksio-laavut.geojson`: molemmat kohteet yhteisessä GeoJSON-muodossa.

## Tietojen hakeminen uudelleen

Suorita projektin juurikansiossa:

```powershell
.\retki.cmd backend fetch:lipas-preview
```

Komento hakee vain nämä kaksi laavua, tarkistaa vastaukset ja päivittää
`nuuksio-laavut.geojson`-tiedoston. Se tulostaa muuttuneet kentät. Pelkkää
hakuaikaa ei lasketa kohteen tietojen muutokseksi.

Uudet alkuperäisvastaukset ja `summary.json` tallentuvat aikaleimalliseen
`fetches`-alikansioon. Yllä mainitut alkuperäiset JSON-otokset säilyvät ennallaan.
Jos jompikumpi verkkopyyntö epäonnistuu tai kohde ei enää vastaa tämän kokeilun
ehtoja, aiempi GeoJSON säilyy. Haku ei kirjoita tietokantaan.

Tietokantaan päivitys tehdään erikseen:

```powershell
.\retki.cmd backend import:lipas-preview
```

Haku ei ole ajastettu eikä etsi uusia kohteita. Viimeisin hakuaika löytyy
GeoJSONin `fetched_at`-kentästä. Alla oleva vertailu kuvaa ensimmäistä aineisto-otosta.

Alkuperäiset vastaukset säilytettiin, jotta muunnosta voi verrata lähteeseen.
GeoJSONissa säilyvät täydet koordinaatit; alla ne on pyöristetty luettavuuden vuoksi.

| Tieto | Takalan laavu | Holma-Saarijärven laavu |
| --- | --- | --- |
| LIPAS-tunniste | 73487 | 73851 |
| Leveysaste | 60.336713 | 60.301328 |
| Pituusaste | 24.500000 | 24.495552 |
| Lähteen tyyppikoodi | 301 | 301 |
| Lähteen tila | active | active |
| Maksuton käyttö lähteen mukaan | kyllä | kyllä |
| Käymälä lähteen mukaan | kyllä | kyllä |
| Lähteen tiedon voimaantulopäivä | 16.9.2020 | 16.9.2020 |

Tyyppikoodi 301 tarkoittaa LIPASissa luokkaa "Laavu, kota tai kammi".
Esikatselussa sovelluksen tyypiksi ehdotetaan `lean_to`, koska molempien kohteiden
nimessä lukee laavu. Tämä ei ole yleinen muunnossääntö kaikille tyypin 301 kohteille.
Lähteen alkuperäinen tyyppikoodi säilytetään rinnalla.

## Mitä tästä voi päätellä?

Tiedot sisältävät kohteen yksilöivän tunnisteen ja sijainnin. Ne ovat siksi
parempi lähtökohta toistettavalle tuonnille kuin aiempi käsin tehty testiaineisto.
GeoJSONin `id`, esimerkiksi `lipas:sports-sites:73487`, yksilöi lähdetietueen.
Se ei vielä ole sovelluksen tietokannan oma kohde-ID.

`fetched_at` kertoo, milloin tieto haettiin. `source_event_date` säilyttää lähteen
`event-date`-arvon eli tiedon voimaantuloajan. Kumpikaan ei todista, milloin laavun
kunto on viimeksi tarkistettu maastossa. Vuoden 2020 aikaleima on huomioitava
aineiston laadun arvioinnissa. `active` ei myöskään ole tuore kuntoraportti.

Tämä kokeilu ei sisällä vesipisteitä eikä osoita koko Nuuksion tai Suomen kattavuutta.

## Tarkistukset

- Molempien vastausten tunniste, tyyppi 301 ja tila active tarkistettiin.
- Molemmilla on täsmälleen yksi Point-geometria ja sallitulla arvoalueella olevat koordinaatit.
- Valmis GeoJSON luettiin takaisin: kaksi kohdetta ja kaksi eri lähdetunnistetta.
- Koordinaattien todellista sijaintia maastossa ei tällä tarkistuksella varmenneta.

## Lähteet

- [Takalan laavun API-vastaus](https://api.lipas.fi/v2/sports-sites/73487)
- [Holma-Saarijärven laavun API-vastaus](https://api.lipas.fi/v2/sports-sites/73851)
- [LIPAS API](https://api.lipas.fi/), Jyväskylän yliopisto
- [Tietomallin kuvaus](https://raw.githubusercontent.com/lipas-liikuntapaikat/lipas/master/docs/api-v2.md)

LIPASin etusivun ja OpenAPI-kuvauksen lisenssimerkintöjen ristiriita on edelleen
selvitettävä ennen julkaisua (ks. `docs/aineistoselvitys.md`).

Rajattu tuonti on toteutettu. Käynnistys- ja testiohjeet löytyvät projektin
juuren README.md-tiedostosta. Uusintatuonti säilyttää sovelluksen kohde-ID:n
ja käyttäjäraportit myös lähdetietojen muuttuessa.
