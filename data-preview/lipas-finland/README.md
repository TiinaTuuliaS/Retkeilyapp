# Suomen LIPAS-taukopaikkojen esikatselu

Haku tehty 7.9.2026 klo 18.55 Suomen aikaa. Tietokantaa ei muutettu.

## Rajaus ja tulos

Haettiin LIPAS API V2:n sports-sites-luokat 301 (laavu, kota tai kammi)
ja 206 (ruoanlaitto-/tulentekopaikka), tiloina aktiivinen tai väliaikaisesti poissa käytöstä.
Kaikki 36 sivua haettiin. Kohteita ei rajattu kunnan tai alueen perusteella.
Tämä ei sisällä erillistä LOI-aineistoa, tupia tai kaikkia Suomen retkikohteita.
Luokan 301 kaikkia kohteita ei pidä nimetä sovelluksessa laavuiksi: luokkaan kuuluu myös kotia ja kammeja.

| Mittari | Määrä |
| --- | ---: |
| Kohteet yhteensä | 3 595 |
| Laavu, kota tai kammi | 2 954 |
| Ruoanlaitto-/tulentekopaikka | 641 |
| Aktiivinen | 3 574 |
| Väliaikaisesti poissa käytöstä | 21 |
| Eri kuntakoodit | 260 |
| Nimi puuttuu | 0 |
| Geometria puuttuu tai piste ei läpäise teknistä tarkistusta | 0 |
| Lähteen event-date ennen vuotta 2022 | 1 640 |

Tunnisteiden määrä vastasi rajapinnan ilmoittamaa kokonaismäärää eikä tunnisteissa
ollut kaksoiskappaleita. Tämä ei sulje pois saman fyysisen paikan tallentamista
usealla eri tunnisteella. Koordinaattien oikeellisuutta maastossa ei varmennettu.
Sivutus ei takaa muuttumattoman tietokantatilanteen otosta; sivujen ilmoittamien
kokonaismäärien yhtäpitävyys tarkistettiin.

## Alueellinen jakauma

Kohteita löytyi leveysasteilta noin 59.82–70.05. Eniten näiden luokkien kohteita:

| Kunta | Kohteita |
| --- | ---: |
| Kuusamo | 94 |
| Kuopio | 90 |
| Salla | 87 |
| Helsinki | 70 |
| Oulu | 68 |
| Hämeenlinna | 63 |
| Mikkeli | 63 |
| Sodankylä | 56 |
| Pudasjärvi | 55 |
| Kuhmo | 52 |

Listarajapinta palautti kuntakoodit mutta ei maakuntien nimiä. Kymmenen yllä
olevan kunnan nimet täydennettiin erillisistä kohdevastauksista. summary.jsonin
maakuntakohta `Tuntematon` kuvaa puuttuvaa metatietoa, ei puuttuvaa kohdesijaintia.
Täydellinen kuntakoodikohtainen jakauma on summary.jsonissa.
Kuntien kohdemäärät eivät mittaa maaston kaikkien todellisten taukopaikkojen kattavuutta.

## Palvelutiedot

| Tieto | Kyllä | Ei | Ei tietoa |
| --- | ---: | ---: | ---: |
| Yleisö-wc | 1 336 | 29 | 2 230 |
| Vapaa käyttö ilman varausta tai pääsymaksua | 2 566 | 41 | 988 |

Vesipistetieto löytyi vain neljältä kohteelta:

| Kohde | LIPAS-ID | Vesipisteen lähdetieto |
| --- | --- | --- |
| Toivosen laavu | 604564 | Ympärivuotinen |
| Sirius-kota | 617514 | Ympärivuotinen |
| Särkijärven päivälaavu ja tulipaikka | 618694 | Kausittainen |
| Kota Mäkikota | 618853 | Ympärivuotinen |

Luokan 301 tietomallissa on `water-point`-kenttä. Sen arvot kuvaavat kausikäyttöä,
eivät veden nykyistä saatavuutta, veden laatua tai juomakelpoisuutta.
Luokan 206 tarkistetussa ominaisuusluettelossa tätä kenttää ei ollut.
Muiden 3 591 kohteen osalta tulos on "ei tietoa", ei "ei vesipistettä".
Haku tutki rakenteiset kentät; vapaiden tekstien sisältöä ei tulkittu vesipistetiedoksi.

`event-date` on lähdetiedon voimaantuloaika, ei maastotarkastuksen ajankohta.
`active` ei tarkoita käyttäjän vahvistamaa hyvää kuntoa.

## Johtopäätös sovellukselle

LIPAS antaa käyttökelpoisen valtakunnallisen lähtöaineiston taukopaikkasovellukselle.
Palvelutiedot ovat kuitenkin puutteellisia. Säilytetään suunnitelma, jossa
taukopaikka on karttakohde ja käymälä sekä vesipiste sen palveluita.
Lähteen perustieto ja päivätty käyttäjähavainto pidetään erillisinä.

Suositeltu seuraava rajattu vaihe: näytetään nykyisillä kokeilukohteilla palvelut
kolmella arvolla (kyllä / ei / ei tietoa), erotetaan vesipisteen kausikäyttö
kuntoraportista ja suunnitellaan käyttäjän palvelukohtainen raportointi.
Ennen valtakunnallista tietokantatuontia tarvitaan erillinen esikatselu muutoksista,
väliaikaisesti suljettujen kohteiden käsittely sekä kartan alueellinen tiedonhaku.
Nykyinen kahden kohteen tuonti ei hyväksy tätä valtakunnallista tiedostoa.

## Tiedostot ja toistaminen

Tulokset: [hakukansio](2026-09-07T15-55-48-879Z/summary.json).

- `summary.json`: koneellisesti luettava yhteenveto ja kuntakoodijakauma.
- `sites.geojson`: 3 595 pistettä lähdetunnisteineen ja palvelutietoineen.
- `categories.json`: käytettyjen luokkien kuvaukset ja palvelukenttien määrittelyt.
- `page-*.json`: alkuperäiset listausvastaukset.
- `top-municipalities.json`: tämän selvityksen kymmenen kunnan nimivertailu.

Uusi haku omaksi aikaleimatuksi otoksekseen:

```powershell
.\retki.cmd backend preview:lipas-finland
```

Komento ei käytä tietokantaa. Virheellinen tai kesken jäänyt haku voi jättää
osittaisia sivutiedostoja omaan hakukansioonsa; valmis summary.json syntyy vasta
kaikkien sivujen tarkistamisen jälkeen. Kymmenen kunnan nimivertailu tehtiin erikseen,
eikä yllä oleva komento luo sitä automaattisesti.

Lähde: [LIPAS API V2](https://api.lipas.fi/), Jyväskylän yliopisto.
Käytetty haku ja hakuajat löytyvät summary.jsonista. Tarkistetut luokat:
[301](https://api.lipas.fi/v2/sports-site-categories/301) ja
[206](https://api.lipas.fi/v2/sports-site-categories/206).
