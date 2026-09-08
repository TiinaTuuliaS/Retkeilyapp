# Seitsemisen LIPAS-tarkistus

Tarkistettu 8.9.2026. **Tietokantaan ei tuotu kohteita**, koska tarkistetuista
aineistoista ei löytynyt puistorajan sisäisiä pistemäisiä kohteita.
Tämä ei tarkoita, ettei puistossa olisi taukopaikkoja tai palveluita.

## Tehdyt haut

1. Suomen 7.9.2026 LIPAS-otoksen luokat 301 ja 206 verrattiin puiston rajaan:
   0 sisäpuolista ja 22 ulkopuolista pistettä laajennetussa hakulaatikossa.
   [Kohdeluettelo](kohteet.md) sisältää vain näitä ulkopuolisia vertailukohteita.
2. Tuore `sports-sites`-haku, kaikki kohdetyypit, kuntakoodit 143 ja 980
   (Ikaalinen ja Ylöjärvi), tilat `active,out-of-service-temporarily`:
   361 kohdetta, kaikki 4 sivua. Puistorajan sisällä 0 pistemäistä kohdetta.
3. Tuore `lois`-haku koko Suomesta, kaikki tyypit, samat tilat:
   1 528 kohdetta, kaikki 16 sivua. Puistorajan sisällä 0 pistemäistä kohdetta.

Tuoreen tarkistuksen [yhteenveto](checks/2026-09-08T09-41-48-046Z/summary.json)
sisältää hakuosoitteet, ajat ja määrät. Sivutuksen kokonaismäärät ja tunnisteiden
yksilöllisyys tarkistettiin. Listaus ei ole muuttumaton tietokantaotos.
620 sports-sites-geometriaa ja 16 LOI-geometriaa eivät olleet pisteitä;
niiden risteämistä puistorajan kanssa ei tutkittu eikä reittejä muunnettu
keksityiksi taukopaikoiksi. Kuntahaku ei löydä väärälle kunnalle merkittyä kohdetta.
Tuloksesta ei siis voi päätellä, ettei LIPASissa olisi mitään Seitsemiseen liittyvää.

## Raja ja lähteet

Raja: [GTK:n jakama luonnonsuojelualueaineisto](https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5),
Metsähallitus / Syke, CC BY 4.0. Tunniste `KPU040004`, Seitsemisen kansallispuisto.
Haettu 8.9.2026, aineiston MuutosPvm 30.9.2025. Hakupäivä ei varmista ajantasaisuutta.
Hakuehto `Nimi LIKE '%Seitsemis%'`, `outFields=*`, `outSR=4326`, `f=geojson`.
Alkuperäinen rajageometria ja kerroskuvaus ovat tässä kansiossa.

Kohteet: [LIPAS API V2](https://api.lipas.fi/), Jyväskylän yliopisto, CC BY 4.0.
Tuoreiden hakujen parametrit tarkistettiin [OpenAPI-kuvauksesta](https://api.lipas.fi/v2/openapi.json).
Puiston sijaintikunnat: [Metsähallituksen Seitseminen-esite](https://julkaisut.metsa.fi/assets/pdf/lp/Esitteet/seitseminenfin.pdf).

## Toistaminen

```powershell
.\retki.cmd backend preview:lipas-seitseminen
.\retki.cmd backend check:lipas-seitseminen
```

Ensimmäinen käyttää paikallista 7.9. otosta. Toinen päivittää esikatselun ja
tekee yllä kuvatut tuoreet haut omaan aikaleimattuun `checks`-kansioon.
Kumpikaan ei kirjoita tietokantaan. Alkuperäiset rajapintasivut jäävät paikallisiksi;
yhteenvedot säilytetään Gitissä. Pisteen luokittelu huomioi moniosaiset alueet,
reiät ja täsmälleen rajalle osuvat pisteet.

## Jatkotoimi

Seitsemisen taukopaikkojen tuonti vaatii toisen käyttökelpoisen aineistolähteen
selvittämisen tai LIPAS-aineiston täydentymisen. Ulkopuolisia paikkoja ei nimetä
Seitsemisen kohteiksi. Tässä vaiheessa ei rakennettu tyhjää tuontikomentoa.
