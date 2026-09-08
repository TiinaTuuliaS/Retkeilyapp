import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { backendRoot } from '../../database.config';
import { Location } from '../locations/location.entity';

const catalog = [
  { slug: 'ukk', name: 'Urho Kekkosen kansallispuisto', region: 'Lappi',
    description: 'Urho Kekkosen kansallispuiston maisemaan kuuluvat tunturit, metsät ja suot. Laaja pohjoinen erämaa tarjoaa ympäristön niin päiväretkille kuin pidemmille vaelluksille.',
    descriptionSource: 'https://julkaisut.metsa.fi/wp-content/uploads/sites/2/2023/03/ukpuistofin.pdf',
    officialUrl: 'https://www.luontoon.fi/fi/kohteet/urho-kekkosen-kansallispuisto',
    coverage: 'Mukana on rajattu LIPAS-otos taukopaikoista. Kaikki puiston kohteet, tuvat ja palvelut eivät vielä sisälly sovellukseen.',
    directory: 'lipas-ukk', boundaryId: 'KPU120026' },
  { slug: 'seitseminen', name: 'Seitsemisen kansallispuisto', region: 'Pirkanmaa',
    description: 'Seitsemisessä retkeillään metsien ja soiden lomassa Ikaalisten ja Ylöjärven alueella. Puistossa voi tutustua myös vanhan maaseudun elämään Koveron perinnetilalla.',
    descriptionSource: 'https://julkaisut.metsa.fi/assets/pdf/lp/Esitteet/seitseminenfin.pdf',
    officialUrl: 'https://www.luontoon.fi/fi/kohteet/seitsemisen-kansallispuisto',
    coverage: 'Puiston taukopaikkojen tiedot puuttuvat vielä sovelluksesta. Tarkistetuista LIPAS-hauista ei löytynyt tuontikelpoisia pisteitä. Tämä ei tarkoita, ettei puistossa olisi palveluita.',
    directory: 'lipas-seitseminen', boundaryId: 'KPU040004' },
];
const publicInfo = ({ directory, ...park }: typeof catalog[number]) => park;

@Controller('parks')
export class ParksController {
  constructor(@InjectRepository(Location) private locations: Repository<Location>) {}

  @Get()
  list() { return catalog.map(publicInfo); }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const park = catalog.find(p => p.slug === slug);
    if (!park) throw new NotFoundException('Kansallispuistoa ei löydy.');
    // The path comes only from the local allowlist, never directly from the URL.
    const boundary = JSON.parse(readFileSync(resolve(backendRoot, '../data-preview', park.directory, 'boundary.geojson'), 'utf8'));
    if (boundary.features.length !== 1 || boundary.features[0].properties.LsAlueTunn !== park.boundaryId) {
      throw new Error('Unexpected park boundary');
    }
    const geometry = boundary.features[0].geometry;
    const rows = await this.locations.query(`SELECT id FROM public.locations
      WHERE longitude IS NOT NULL AND latitude IS NOT NULL
      AND ST_Covers(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),
        ST_SetSRID(ST_MakePoint(longitude,latitude),4326)) ORDER BY id`, [JSON.stringify(geometry)]);
    return { ...publicInfo(park), geometry, locationIds: rows.map(row => row.id),
      boundarySource: 'https://gtkdata.gtk.fi/arcgis/rest/services/Tukes/suojelualueet/MapServer/5',
      boundaryAttribution: 'Metsähallitus / Syke, jakelu GTK · CC BY 4.0',
      boundaryUpdatedOn: new Date(boundary.features[0].properties.MuutosPvm).toISOString().slice(0,10),
      descriptionCheckedOn: '2026-09-08' };
  }
}
