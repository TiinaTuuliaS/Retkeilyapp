# Lemmenjoen rajattu LIPAS-tuonti

12.9.2026 tuotiin kolme kohdetta kehitystietokantaan:

| Kohde | LIPAS-ID | Paikallinen ID |
| --- | --- | --- |
| Kultahaminan sääsuoja | 73872 | 155 |
| Sotkajärven puolilaavu | 73951 | 156 |
| Juurakkojoen sääsuoja | 74120 | 157 |

Puistosivu: http://localhost:5173/#/parks/lemmenjoki
Sääsuojat näytetään omalla kohdelajillaan. Kaikki kolme on LIPASissa merkitty
aktiivisiksi, vapaasti käytettäviksi ja käymälällä varustetuiksi. Vesipisteen
kausikäyttötieto puuttuu, joten siitä näytetään ”Ei tietoa”.

## Lähteet ja kattavuus

Ehdokkaat poimittiin 7.9.2026 valtakunnallisesta LIPAS-otoksesta, luokat 301 ja
206. Kolmen tietueen tiedot haettiin uudelleen 12.9.2026; vastaukset, lähdeosoitteet
ja hakuajat ovat [raw.json](raw.json)-tiedostossa. Uusi haku ei tarkoita uutta
maastohavaintoa. Otos ei sisällä kaikkia puiston tupia tai palveluita, eikä
7.9. jälkeen kokonaan lisättyjen kohteiden mukanaoloa ole tarkistettu.
OSM-täydennyksiä ei tässä vaiheessa haettu.

Puistoraja KPU120024, lähteen muokkauspäivä 22.4.2025, haettu 12.9.2026:
[GTK:n jakama suojelualuerajapinta](https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5),
Metsähallitus / Syke, CC BY 4.0. Kohteet tarkistettiin rajan sisälle myös PostGISillä.

## Toistaminen

Projektin juuresta:

```powershell
.\retki.cmd backend preview:lipas-lemmenjoki
.\retki.cmd backend test:lemmenjoki-import
.\retki.cmd backend import:lipas-lemmenjoki
```

Esikatselu hakee lähteet, tuonti käyttää paikallista otosta ja kiinteää kolmen
LIPAS-tunnisteen listaa. Tuonti ei ole ajastettu. Uusintatuonti päivittää samat
kohteet tekemättä kaksoiskappaleita. Uusi kohde alle 30 metrin päässä olemassa
olevasta tietokantakohteesta pysäyttää tuonnin tarkistusta varten.
Tilapäinen sulkutila voidaan säilyttää myöhemmässä tuonnissa nykyisen käyttötilamallin avulla.

Koetuonnissa tarkistettiin pysyvät tunnisteet, kohdemäärä ja raportin sekä
käyttötilahavainnon säilyminen. Testitiedot peruttiin transaktiolla.
Varsinainen tuonti varmisti raporttien, vesi- ja käyttötilahavaintojen säilymisen.
Puistosivujen testit ja molemmat käännökset onnistuivat. Käynnissä olevasta
APIsta tarkistettiin kolme kohdetta ja palvelutiedot. Visuaalista selaintestiä ei tehty.
