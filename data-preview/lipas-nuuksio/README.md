# Nuuksion kansallispuistosivu ja LIPAS-päivitys

25.9.2026 Nuuksiolle lisättiin oma sivu: http://localhost:5173/#/parks/nuuksio
Puistossa on kaksi LIPAS-laavua ja 16 OSM-täydennystä eli 18 lähteistettyä kohdetta.
Puistosivun rajaus palauttaa lisäksi kolme vanhaa lähteetöntä kehityskohdetta
(ID 1 Nuuksio vesipiste, ID 6 Haukanholman tulentekopaikka, ID 7 Haukanholman
vesipiste), yhteensä 21 kohdetta. Näitä ei poistettu tai yhdistetty automaattisesti.
Vanha Haukanholman tulipaikka on eri koordinaateissa kuin OSM:n samanniminen
kohde. ID:t 6 ja 7 ovat alkuperäisestä varmentamattomasta testiaineistosta
(`docs/aineistoselvitys.md`). Raporttien mahdollinen siirto edellyttää kohteen
identiteetin tarkistusta; pelkkä sama nimi ei riitä.
[OSM-tuonnin tarkistus ja rajaukset](../osm-parks/nuuksio-review.md).

LIPAS-tietueet haettiin 24.9.2026 ja päivitettiin tietokantaan 25.9.2026:

| Kohde | LIPAS | Paikallinen tunniste |
| --- | --- | --- |
| Takalan laavu | 73487 | 10 (säilyi) |
| Holma-Saarijärven laavu | 73851 | 11 (säilyi) |

Molemmat ovat lähteessä aktiivisia, vapaasti käytettäviä ja käymälällisiä.
Vesipistetieto puuttuu. Vanhoja käyttäjähavaintoja ei muutettu.

Ehdokkaat poimittiin 7.9.2026 valtakunnallisesta LIPAS-otoksesta, luokista
301 ja 206. Puistorajan sisällä olivat vain nämä kaksi kohdetta. Yksittäiset
tietueet päivitettiin, mutta tämä ei ole uusi koko LIPASin inventointi.
Otoksen jälkeen lisätyt kohteet ja muut kohdetyypit voivat puuttua.

Puistoraja KPU010030: Metsähallitus / Syke, jakelu GTK, CC BY 4.0.
https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5

LIPAS / Jyväskylän yliopisto, CC BY 4.0:
https://api.lipas.fi/v2/sports-sites/73487 ja https://api.lipas.fi/v2/sports-sites/73851

```powershell
.\retki.cmd backend preview:lipas-nuuksio
.\retki.cmd backend test:nuuksio-import
.\retki.cmd backend import:lipas-nuuksio
```

Tuonti on rajattu näihin kahteen lähdetunnisteeseen. Uusintatuonti säilyttää
paikalliset tunnisteet. Koetuonti tarkisti rajan, raportin ja käyttötilahavainnon
säilymisen ja perui testimuutokset. Varsinainen tuonti tarkisti kaikkien kolmen
havaintolajin sisältötiivisteiden säilymisen. Puistosivujen 10 testiä menivät läpi.
Ei ajastusta. Alkuperäinen kahden laavun kokeilu säilyy `data-preview/lipas`-kansiossa.
