import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Location } from '../locations/location.entity';
import { ParksController } from './parks.controller';

describe('Park pages', () => {
  const query = jest.fn();
  const controller = new ParksController({ query } as unknown as Repository<Location>);
  beforeEach(() => query.mockReset());
  it('lists both parks without loading detailed geometries or the database', () => {
    const parks = controller.list();
    expect(parks.map(p => p.slug)).toEqual(['ukk', 'seitseminen']);
    expect(parks[0]).not.toHaveProperty('directory');
    expect(query).not.toHaveBeenCalled();
  });
  it.each(['unknown', '../../.env'])('rejects unknown park %s before database access', async slug => {
    await expect(controller.detail(slug)).rejects.toBeInstanceOf(NotFoundException);
    expect(query).not.toHaveBeenCalled();
  });
  it('uses the original park geometry to select current location IDs', async () => {
    query.mockResolvedValue([{ id: 54 }]);
    const park = await controller.detail('ukk');
    expect(park.locationIds).toEqual([54]);
    expect(park.boundaryId).toBe('KPU120026');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ST_Covers'), [JSON.stringify(park.geometry)]);
  });
  it('returns Seitseminen and its coverage explanation even without locations', async () => {
    query.mockResolvedValue([]);
    const park = await controller.detail('seitseminen');
    expect(park.locationIds).toEqual([]);
    expect(park.boundaryId).toBe('KPU040004');
    expect(park.coverage).toContain('puuttuvat');
  });
});
