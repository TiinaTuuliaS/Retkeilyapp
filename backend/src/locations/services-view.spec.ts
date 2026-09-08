import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { LocationsService } from './locations.service';

describe('Location service information', () => {
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
