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
       WHERE source='lipas' AND source_collection='sports-sites' ORDER BY imported_at DESC`,
    ) : [];
    return locations.map(location => {
      const source = sources.find(row => row.location_id === location.id);
      const metadata = source?.metadata ?? {};
      const boolean = (value: unknown) => typeof value === 'boolean' ? value : null;
      const water = metadata.water_point;
      return { ...location, services: {
        toilet: boolean(metadata.toilet), freeUse: boolean(metadata.free_use),
        waterPoint: ['year-round', 'seasonal'].includes(water) ? water : null,
      }, source: source ? { name: 'LIPAS', url: source.source_url } : null };
    });
  }
}
