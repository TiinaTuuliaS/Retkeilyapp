# Nuuksion vesipisteet ja taukopaikat: saatavuuden jatkoselvitys

Selvitys 7.9.2026. Sovelluksen tietokantaa ei muutettu. Alla on rajattu
vertailu, ei täydellinen Nuuksion palvelurakenteiden inventaario.

## Mitä löytyi?

| Kohde | Todettu saatavuus | Avoin kysymys |
| --- | --- | --- |
| Takalan laavu | LIPAS API V2, tunniste 73487; jo tuotu sovellukseen | Perustiedon tuoreus maastossa |
| Holma-Saarijärven laavu | LIPAS API V2, tunniste 73851; jo tuotu sovellukseen | Perustiedon tuoreus maastossa |
| Haukkalammen vesipiste | Oma sivu Luontoon-palvelussa | Dokumentoitu ohjelmallinen jakelu ja käyttöoikeus |
| Haukanholman keittokatos | Oma sivu Luontoon-palvelussa | Vastaava lähdetietue ja jakelu |
| Iso-Holman tulentekopaikka | Oma sivu Luontoon-palvelussa | Vastaava lähdetietue ja jakelu |

LIPAS-vertailu perustuu aiempiin saman päivän rajapintakokeisiin, joiden rajaukset
on kirjattu `aineistoselvitys.md`-tiedostoon. Puuttuminen niistä ei todista,
ettei tietoa olisi missään LIPASin aineistossa. Verkkosivujen hakukonetulokset
eivät myöskään riitä kaikkien Nuuksion kohteiden lukumäärän määrittämiseen.
Nuuksion palvelulistauksen täydellinen lukeminen ei onnistunut tässä selvityksessä.

Kohdeviitteet:

- [Haukkalammen vesipiste](https://www.luontoon.fi/fi/kohteet/nuuksion-kansallispuisto/palvelu/haukkalammen-vesipiste-vesipiste-202957)
- [Haukanholman keittokatos](https://www.luontoon.fi/fi/kohteet/nuuksion-kansallispuisto/palvelu/haukanholman-keittokatos-keittokatos-12104)
- [Iso-Holman tulentekopaikka](https://www.luontoon.fi/fi/kohteet/nuuksion-kansallispuisto/palvelu/iso-holman-tulentekopaikka-tulentekopaikka-2411)

## Käyttöehdot ja rajapinta

[Luontoon-palvelun käyttöehdot](https://www.luontoon.fi/fi/kayttoehdot), päivitetty
30.6.2026, rajaavat sivuston käytön yksityiseen ei-kaupalliseen käyttöön ja
edellyttävät kirjallista lupaa aineiston muuhun hyödyntämiseen ja julkaisemiseen.
Sivustolta löytyminen ei siten ole riittävä peruste aineiston tuomiselle
julkaistavaan sovellukseen. Tämä ei ratkaise erikseen lisensoidun rajapinta-aineiston
käyttöoikeutta: sitä pitää kysyä aineiston ylläpitäjältä.

Tässä selvityksessä ei löytynyt varmennettua, dokumentoitua Metsähallituksen
vesi- ja taukopaikkojen avointa rajapintaa käyttöehtoineen. Tämä on saatavuuteen
jäänyt avoin kysymys, ei väite siitä, ettei sellaista olisi.

[LIPASin rekisteröitymissivun ehdoissa](https://www.lipas.fi/rekisteroidy)
tietoaineisto ilmoitetaan avoimeksi CC 4.0 Nimeä -aineistoksi. Ulkopuoliset kuvat
on rajattu tämän ulkopuolelle. Tämä tukee API-etusivun CC BY 4.0 -merkintää.
OpenAPI-kuvauksen aiemmin havaittu CC BY-SA -merkintä on yhä ristiriitainen;
sen täsmennystä voi pyytää samalla LIPAS-ylläpidolta.

Metsähallituksen [vuoden 2026 huoltomuutokset](https://www.metsa.fi/vapaa-aika-luonnossa/retkeily/retkeilypalvelujen-priorisointi/muutokset-taukopaikkojen-huollossa-vuonna-2026/)
osoittavat, että ylläpidon laajuus voi muuttua. Tietomallissa on siksi myöhemmin
erotettava kohteen olemassaolo, ylläpidon tila ja käyttäjän havainto kunnosta.

## Suositus

Jatka LIPASin dokumentoidun aineiston hyödyntämistä, mutta älä oleta sen kattavan
kaikkia vesipisteitä. Selvitä Metsähallituksen aineiston jakelu seuraavalla
kyselyllä. Vastauksesta tarvitaan rajapinta tai aineistotoimitus, käyttöehdot,
kattavuus, pysyvät tunnisteet ja päivitys-/poistokäytäntö.

## Valmis kysely Metsähallitukselle — ei lähetetty

Yhteydenottokanava: [Luontoon-palvelun palautelomake](https://www.luontoon.fi/fi/palaute).
Pyydä välittämään viesti paikkatietoaineistojen tai Luontoon-palvelun teknisestä
jakelusta vastaavalle henkilölle.

**Aihe: Retkeilyn palvelurakenteiden paikkatiedon käyttö omassa sovelluksessa**

Hei,

Kehitän retkeilysovellusta, jonka tavoitteena on kattaa Suomen retkikohteita.
Käyttäjä voi paikantaa itsensä ja kirjoittaa muille retkeilijöille havaintoja
esimerkiksi vesipisteen toimivuudesta tai taukopaikan kunnosta. Käyttäjähavainnot
pidetään erillään ylläpitäjän perustiedoista. Sovellus on kehitysvaiheessa,
mutta tarkoitus on julkaista se myöhemmin.

Ensimmäinen kokeilualue on Nuuksio. Käytän jo LIPAS API V2:sta löytyviä
Takalan ja Holma-Saarijärven laavuja. Kaikkia tarvitsemiani vesipisteitä ja
taukopaikkoja en ole löytänyt LIPASista, vaikka niitä esitellään Luontoon-palvelussa.
Esimerkkinä Haukkalammen vesipiste.

Voisitteko kertoa:

1. Onko Metsähallituksen vesipisteiden, laavujen, keittokatosten ja tulentekopaikkojen
   tiedoille dokumentoitu rajapinta tai ladattava aineisto ulkopuolisia sovelluksia varten?
2. Kattaako aineisto Nuuksion ja valtakunnallisesti Metsähallituksen kohteet?
   Ovatko nämä tiedot myös LIPASissa, ja jos ovat, mistä tietoryhmästä ne löytyvät?
3. Millä lisenssillä tietoja saa tallentaa omaan tietokantaan, päivittää ja näyttää
   julkisessa sovelluksessa? Onko kaupallinen käyttö mahdollista ja mitä lähdemerkintöjä edellytetään?
4. Onko kohteilla pysyvät tunnisteet, ja miten muutokset, sulkemiset, ylläpidosta
   poistumiset sekä lopulliset poistot välitetään?
5. Sisältääkö vesipisteaineisto tiedon kausikäytöstä, toimivuudesta tai veden
   käyttöä koskevista ohjeista sekä näiden tietojen päiväyksistä?
6. Tarvitaanko API-avain tai sopimus, ja onko käytölle maksuja tai hakurajoituksia?

En tarvitse tässä vaiheessa valokuvia. Ensisijaisesti tarvitsen nimet, tyypit,
koordinaatit, pysyvät tunnisteet ja käytettävissä olevat ylläpito- ja tilatiedot.

Kiitos avusta! Voitte tarvittaessa välittää kyselyn oikealle asiantuntijalle.

Ystävällisin terveisin,
[oma nimi]

## Lyhyt lisäkysymys LIPAS-ylläpidolle — ei lähetetty

Yhteystieto `lipasinfo@jyu.fi` on LIPASin julkaisemissa ohjeissa.

Hei! Käytän LIPAS API V2:n sports-sites- ja lois-aineistoja retkeilysovelluksen
kehityksessä. API-etusivu ja rekisteröitymissivun ehdot ilmoittavat CC BY 4.0
-lisenssin, mutta OpenAPI-tiedoston lisenssitunniste ja linkki viittaavat CC BY-SA 4.0:aan.
Voitteko vahvistaa, mikä lisenssi koskee näitä tietoaineistoja ja mikä on toivottu
lähdemerkintä? Lisäksi: ovatko Metsähallituksen Nuuksion vesipisteet, kuten
Haukkalammen vesipiste, saatavissa LIPASista vai erillisestä lähteestä?
