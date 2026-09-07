# Retkikohdeaineiston ensimmäinen selvitys

Tarkistettu 7.9.2026. Tämä on selvitys, ei valmis aineistointegraatio.
Sovelluksen tietokantaan ei tehty muutoksia.

## Sovelluksen tavoite

Suomen retkipaikat kattava sovellus, jossa retkeilijä paikantaa itsensä ja raportoi
yksittäisen palvelun, esimerkiksi vesipisteen tai taukopaikan, kunnosta.
Myöhemmin toteutetaan tilin luominen, kirjautuminen ja moderni mobiilikäyttöliittymä.
Aineiston luotettavuus ja päivitysten hallinta ovat tämän vaiheen painopiste.

## Nykyinen Nuuksion tiedosto

Käyttäjä vahvisti selvityksen jälkeen, että alkuperäinen tiedosto oli kesken jäänyt
testiaineisto. Uusi kahden LIPAS-laavun esikatselu on kansiossa `data-preview/lipas`.
Se ei korvaa tietokannan kohteita tai alkuperäistä tiedostoa.

`backend/data/nuuksio.geojson` sisältää kaksi Point-kohdetta:

| Nimi | Tyyppi | Pituusaste | Leveysaste |
| --- | --- | --- | --- |
| Haukanholman tulentekopaikka | fireplace | 24.5147 | 60.3139 |
| Haukanholman vesipiste | water | 24.5160 | 60.3145 |

Tiedoston JSON ja koordinaattien järjestys sopivat nykyiseen tuontiin.
Tiedostosta tai projektin dokumentaatiosta ei löytynyt alkuperäistä aineistolähdettä,
lähteen kohdetunnisteita, lisenssiä tai päivitysaikaa. Kohteiden todellista sijaintia
ja vesipisteen tietoja ei siksi ole varmennettu. Tiedostoa tulee käsitellä toistaiseksi
varmentamattomana kehitysaineistona, ei kattavana Nuuksion aineistona.

Luontoon-palvelussa on [Haukkalammen vesipiste](https://www.luontoon.fi/fi/kohteet/nuuksion-kansallispuisto/palvelu/haukkalammen-vesipiste-vesipiste-202957)
ja [Haukanholman keittokatos](https://www.luontoon.fi/fi/kohteet/nuuksion-kansallispuisto/palvelu/haukanholman-keittokatos-keittokatos-12104).
Nimet eivät yksin osoita, että paikallisen tiedoston pisteet vastaavat näitä kohteita.

Tuontiskripti tekee vain INSERT-lisäyksiä. Se ei tunnista uusintatuontia,
validoi aineistoa tai käsittele koko tuontia yhtenä transaktiona.
Virhe kesken tuonnin voi jättää osan riveistä lisätyiksi.

## LIPAS: todetut mahdollisuudet ja rajat

[LIPAS API](https://api.lipas.fi/) suosittelee uusille integraatioille versiota 2.
[Tietomalliohje](https://raw.githubusercontent.com/lipas-liikuntapaikat/lipas/master/docs/api-v2.md)
erottaa sports-sites-kohteet ja täydentävät lois-palvelupisteet.
Retkeilykohteita voi olla molemmissa ryhmissä.

Tehdyt rajapintakokeilut:

- `/v2/lois`, tyypit `water-source,well,fire-pit,cooking-shelter,rest-area`,
  tilat `active,out-of-service-temporarily`, kaikki palautetut sivut:
  yhteensä 140 kohdetta (9 vesilähdettä, 3 kaivoa, 69 tulipaikkaa,
  9 keittokatosta ja 50 taukopaikkaa).
- Tästä joukosta ei löytynyt nimellä Nuuksio/Haukkalampi/Haukanholma eikä
  suorakulmion 24.4–24.7 E, 60.24–60.4 N sisältä kohteita.
  Suorakulmio oli etsintärajaus, ei kansallispuiston virallinen rajaus.
- `/v2/sports-sites`, kuntakoodit 49, 257 ja 927, tyypit 301 ja 302:
  5 kohdetta. Näistä Takalan laavu (73487) ja Holma-Saarijärven laavu (73851)
  ovat käyttökelpoisia Nuuksion ensimmäiseen vertailuun.
- Samoista kunnista tyypeillä 206 ja 202 saatiin 45 kohdetta.
  Mukana oli Kattilajärven kohteita, mutta ei Haukanholma-nimistä kohdetta.
  Kuntahaku ei ole Nuuksion kansallispuiston kattavuusmittaus.

Nämä ovat rajattujen hakujen hetkellisiä tuloksia, eivät Suomen kaikkien kohteiden
määriä. LIPAS yksin ei tämän kokeen perusteella varmista Nuuksion kaikkien
vesipisteiden ja taukopaikkojen kattavuutta.

[OpenAPI-kuvaus](https://api.lipas.fi/v2/openapi.json) tarjoaa palvelupisteille
tunnisteen, geometrian, tilan ja tiedon voimaantuloajan. Voimaantuloaika ei ole
todiste viimeisimmästä maastotarkastuksesta. Listaukset ovat sivutettuja.
Ensimmäinen haku ilman nimenomaista tilasuodatinta palautti myös
`incorrect-data`-testikohteen: integraation tulee suodattaa ja tarkistaa tilat itse.

Lisenssidokumentaatiossa havaittiin ristiriita: API-etusivu ilmoittaa CC BY 4.0,
mutta OpenAPI-tiedoston lisenssitunniste ja linkki osoittavat CC BY-SA 4.0:aan.
Tämä tulee selvittää ylläpitäjältä ennen aineiston julkaisemista sovelluksessa.
Yhteydenottoa ei tässä vaiheessa lähetetty.

## Metsähallituksen rooli

[Luontoon-palvelun kuvaus](https://www.luontoon.fi/fi/tietoa-palvelusta) kertoo,
että aineistoa yhdistetään Metsähallituksen järjestelmistä ja LIPASista.
Luontoon-palvelussa näkyminen ei siten takaa kohteen löytymistä LIPASista.
Tässä selvityksessä ei varmistunut Metsähallituksen palvelurakenteiden dokumentoitu,
ulkopuoliselle sovellukselle tarkoitettu avoin rajapinta käyttöehtoineen.
Se on selvitettävä etenkin vesipisteitä varten.

## Ehdotettu seuraava pieni vaihe

Tee kahden LIPAS-laavun esikatseluhaku omaan tiedostoon, ei vielä tietokantaan.
Näytä nimi, lähdetunniste, tyyppi, koordinaatit ja lähteen tila. Säilytä
hakuaika ja lähdeosoite. Vertaa havaintoja käyttäjän kanssa.

Tämän jälkeen suunnitellaan pysyvä lähdekytkentä:

- Sovelluksen oma kohde-ID säilyy ja käyttäjäraportit liittyvät siihen.
- Lähde + aineistoryhmä + lähteen tunniste yksilöivät tuodun tietueen.
- Uusintatuonti päivittää lähdetiedot, mutta ei käyttäjäraportteja.
- Useasta lähteestä löytyviä samankaltaisia kohteita ei yhdistetä automaattisesti
  pelkän nimen tai läheisyyden perusteella.
- Epäonnistunut tai vajaa haku ei poista kohteita. Lähteestä poistuneet kohteet
  käsitellään erikseen säilyttäen raporttihistoria.
- Perustiedot ja käyttäjähavainnot pidetään erillään. Raporteille tarvitaan
  aikaleima; vesipisteen toimivuus ja veden juomakelpoisuus ovat eri tietoja.

Tavoiteltu ensimmäinen hyväksymistesti: tuonti kahdesti ei lisää kaksoiskappaleita,
lähteen nimen muutos säilyttää sovelluksen kohde-ID:n ja siihen liitetyt raportit.
