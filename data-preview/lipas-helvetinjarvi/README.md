# Helvetinjärven LIPAS-tarkistus

Tarkistettu 12.9.2026. **Puistorajan sisältä ei löytynyt tuontikelpoisia
pistemäisiä kohteita tarkistetuista hauista. Tietokantaa ei muutettu.**

- 7.9.2026 valtakunnallinen otos, sports-sites-luokat 301 ja 206: 0 pistettä
  puiston sisällä ja 18 ulkopuolella laajennetussa hakulaatikossa.
- Tuore sports-sites-haku, Ruovesi (702), kaikki kohdetyypit, tilat
  active ja out-of-service-temporarily: 56 kohdetta, 0 sisäpuolista pistettä.
- Tuore LOI-haku, koko Suomi ja kaikki tyypit, samat tilat: 1 562 kohdetta,
  0 sisäpuolista pistettä. Kaikki sivut tarkistettiin ja tunnisteiden
  yksilöllisyys sekä kokonaismäärät varmennettiin.

[Tuoreen haun yhteenveto](checks/2026-09-12T14-10-46-641Z/summary.json)
sisältää hakuosoitteet ja ajat. [Kohdeluettelo](kohteet.md) näyttää vain
ulkopuoliset vertailukohteet, ei Helvetinjärven taukopaikkoja.

34 sports-sites-geometriaa ja 16 LOI-geometriaa olivat muita kuin pisteitä.
Niiden risteämistä puiston kanssa ei tutkittu. Kuntahaku ei löydä väärälle
kunnalle kirjattuja kohteita. Tulos ei osoita, ettei puistossa olisi palveluita
tai ettei LIPASissa olisi puistoon liittyviä reittejä.

Raja: [GTK:n jakama luonnonsuojelualueaineisto](https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5),
tunniste KPU040005. Metsähallitus / Syke, CC BY 4.0. Raja haettu 12.9.2026,
aineiston MuutosPvm 1.10.2024. Hakuehto `Nimi LIKE '%Helvetinj%' AND TyyppiLyhe='KPU'`,
`outFields=*`, `outSR=4326`, `f=geojson`. Hakupäivä ei takaa rajan ajantasaisuutta.
Kohteiden lähde: [LIPAS API V2](https://api.lipas.fi/), Jyväskylän yliopisto.

Toistaminen projektin paikallisella Nodella:

```powershell
.\retki.cmd backend preview:lipas-helvetinjarvi
.\retki.cmd backend check:lipas-helvetinjarvi
```

Esikatselu käyttää paikallista 7.9. otosta. Tarkistus tekee tuoreet haut
aikaleimattuun checks-kansioon. Kumpikaan komento ei kirjoita tietokantaan.
Tuontia varten tarvitaan täydentävää aineistoa; ulkopuolisia kohteita ei
tuoda Helvetinjärven taukopaikkoina.
