import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { LocationsService } from './locations.service';

describe('Location service information', () => {
  it('shows OSM well existence without inferring seasonality, drinking safety or free use', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 8, type: 'water' }, { id: 9, type: 'rest_area' }]),
      query: jest.fn().mockResolvedValueOnce([{ name: 'location_sources' }]).mockResolvedValueOnce([
        { location_id: 8, source: 'osm', source_url: 'https://www.openstreetmap.org/node/3646381763',
          metadata: { tags: { drinking_water: 'yes', man_made: 'water_well' } } },
        { location_id: 9, source: 'osm', metadata: { tags: { drinking_water: 'yes' } } },
      ]),
    };
    const result = await new LocationsService(repo as unknown as Repository<Location>).findAll();
    expect(result[0].services).toEqual({ toilet: null, freeUse: null, waterPoint: 'exists' });
    expect(result[0].source).toMatchObject({ name: 'OpenStreetMap', license: 'ODbL-1.0', downloadUrl: '/locations/osm.geojson' });
    expect(result[1].services.waterPoint).toBeNull();
  });
  it('exports attributed OSM base data without user observations', async () => {
    const repo = { query: jest.fn().mockResolvedValueOnce([{ name: 'location_sources' }]).mockResolvedValueOnce([
      { id: 8, name: 'Kaivo', type: 'water', longitude: 23.8, latitude: 62.0, source_id: '3646381763',
        source_url: 'https://www.openstreetmap.org/node/3646381763', metadata: { tags: { man_made: 'water_well' } } },
    ]) };
    const result = await new LocationsService(repo as unknown as Repository<Location>).osmExport();
    expect(result.license).toBe('https://opendatacommons.org/licenses/odbl/1-0/');
    expect(result.features[0]).toMatchObject({ id: 'osm:node:3646381763', geometry: { coordinates: [23.8, 62.0] } });
    expect(result.features[0].properties).not.toHaveProperty('id');
    expect(repo.query.mock.calls[1][0]).not.toMatch(/reports|water_observations/);
  });
  it('keeps false distinct from missing information and returns known water seasonality', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      query: jest.fn().mockResolvedValueOnce([{ name: 'location_sources' }]).mockResolvedValueOnce([
        { location_id: 1, source_url: 'https://api.lipas.fi/v2/sports-sites/1',
          metadata: { toilet: false, free_use: true, water_point: 'seasonal' } },
      ]),
    };
    const result = await new LocationsService(repo as unknown as Repository<Location>).findAll();
    expect(result[0].services).toEqual({ toilet: false, freeUse: true, waterPoint: 'seasonal' });
    expect(result[1].services).toEqual({ toilet: null, freeUse: null, waterPoint: null });
    expect(result[1].source).toBeNull();
  });
  it('works before the optional source table has been created', async () => {
    const repo = { find: jest.fn().mockResolvedValue([{ id: 1 }]), query: jest.fn().mockResolvedValue([{ name: null }]) };
    const result = await new LocationsService(repo as unknown as Repository<Location>).findAll();
    expect(result[0].services.toilet).toBeNull();
    expect(repo.query).toHaveBeenCalledTimes(1);
  });
});
