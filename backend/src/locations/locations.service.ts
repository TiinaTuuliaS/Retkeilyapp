import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private repo: Repository<Location>,
  ) {}

  async findAll() {
    const locations = await this.repo.find();
    const available = await this.repo.query("SELECT to_regclass('public.location_sources') AS name");
    const sources = available[0]?.name ? await this.repo.query(
      `SELECT location_id, metadata, source, source_url FROM public.location_sources
       WHERE (source='lipas' AND source_collection='sports-sites')
          OR (source='osm' AND source_collection='node') ORDER BY imported_at DESC`,
    ) : [];
    return locations.map(location => {
      const source = sources.find(row => row.location_id === location.id);
      const metadata = source?.metadata ?? {};
      const boolean = (value: unknown) => typeof value === 'boolean' ? value : null;
      const water = metadata.water_point;
      const osm = source?.source === 'osm';
      return { ...location,
        sourceStatus: !osm && source ? metadata.source_status ?? null : null,
        sourceStatusDate: !osm && source ? metadata.source_event_date ?? null : null,
        services: {
        toilet: osm ? null : boolean(metadata.toilet), freeUse: osm ? null : boolean(metadata.free_use),
        waterPoint: osm ? (location.type === 'water' ? 'exists' : null)
          : ['year-round', 'seasonal'].includes(water) ? water : null,
      }, source: source ? { name: osm ? 'OpenStreetMap' : 'LIPAS', url: source.source_url,
        ...(osm ? { attribution: '© OpenStreetMap contributors', license: 'ODbL-1.0',
          licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/', downloadUrl: '/locations/osm.geojson' } : {}) } : null };
    });
  }

  async osmExport() {
    const available = await this.repo.query("SELECT to_regclass('public.location_sources') AS name");
    const rows = available[0]?.name ? await this.repo.query(`SELECT l.id,l.name,l.type,l.longitude,l.latitude,
      s.source_id,s.source_url,s.source_event_date,s.fetched_at,s.metadata FROM public.location_sources s
      JOIN public.locations l ON l.id=s.location_id
      WHERE s.source='osm' AND s.source_collection='node' ORDER BY s.source_id`) : [];
    // Export OSM-derived base data only; user reports and identities are not part of this dataset.
    return { type: 'FeatureCollection', attribution: '© OpenStreetMap contributors',
      license: 'https://opendatacommons.org/licenses/odbl/1-0/',
      features: rows.map(row => ({ type: 'Feature', id: `osm:node:${row.source_id}`,
        geometry: { type: 'Point', coordinates: [row.longitude,row.latitude] },
        properties: { name: row.name, type: row.type, sourceUrl: row.source_url,
          osmModifiedAt: row.source_event_date, fetchedAt: row.fetched_at, ...row.metadata } })) };
  }
}
