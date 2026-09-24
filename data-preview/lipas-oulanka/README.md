# Oulangan rajattu tuonti 24.9.2026

Tuotu 36 LIPAS-tietuetta (paikalliset ID:t 200–235): 17 laavua/kotaa,
17 tulentekopaikkaa ja kaksi taukokatosta. Tämä ei tarkoita 36 erillistä
retkialuetta tai varmennettua taukopaikkakokonaisuutta. Samalla taukopaikalla
voi olla useita rakenteita. Kohteita ei ole tarkistettu maastossa.

Puistosivu: http://localhost:5173/#/parks/oulanka

40 ehdokasta poimittiin 7.9.2026 valtakunnallisesta otoksesta (luokat 301/206).
Kaikkien tiedot päivitettiin LIPASista 24.9.2026. Kaikki ovat lähteessä aktiivisia.
Raakatietueet ja hakuajat: `raw.json`. Rajaus ja luettelo: `sites.geojson`,
`kohteet.md`. Hyväksytty lista ja pois jätettyjen syyt: `review.json`.

Pois jäivät yrittäjäkäyttöön nimetty laavu 73001, leirintäalueen tulipaikat
73532 sekä rakenteiden ryhmittelyä odottavat Jussinkämpän tulipaikat 73463
(28 m kodasta) ja Harrisuvannon taukokatos 603973 (40 m ylälaavusta).
Etäisyys ei yksin todista kaksoiskappaletta. Myös tuodussa joukossa voi olla
samaan laajempaan taukopaikkaan kuuluvia erillisiä rakenteita.

Puistoraja KPU110020, Metsähallitus / Syke, jakelu GTK, CC BY 4.0:
https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5
Muokkauspäivä 5.6.2025. PostGIS varmisti tuodut pisteet rajan sisälle.
Puuttuvat palvelutiedot säilyvät tuntemattomina. Vesipistetietoa ei löytynyt.
Uusia 7.9. jälkeen lisättyjä kohteita tai muita kohdelajeja ei haettu kattavasti.

## Komennot projektin juuresta

```powershell
.\retki.cmd backend preview:lipas-oulanka
.\retki.cmd backend test:oulanka-import
.\retki.cmd backend import:lipas-oulanka
```

Tuonti käyttää kiinteää 36 tunnisteen listaa ja paikallista lähdeotosta.
Ei ajastusta. Koetuonti varmisti tunnisteiden ja kohdemäärän säilymisen
uusintatuonnissa sekä raportin ja käyttötilahavainnon säilymisen; testitiedot
peruttiin. Varsinainen tuonti tarkisti raporttien, vesi- ja käyttötilahavaintojen
sisältötiivisteet. Puistosivujen testit ja frontend/backend-käännökset läpäistiin.
Visuaalista selaintestiä ei tehty.
