import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Location } from '../locations/location.entity';
import { ParksController } from './parks.controller';

describe('Park pages', () => {
  const query = jest.fn();
  const controller = new ParksController({ query } as unknown as Repository<Location>);
  beforeEach(() => query.mockReset());
  it('lists parks without loading detailed geometries or the database', () => {
    const parks = controller.list();
    expect(parks.map(p => p.slug)).toEqual(['nuuksio', 'repovesi', 'koli', 'oulanka', 'lemmenjoki', 'pallas', 'ukk', 'seitseminen', 'helvetinjarvi']);
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
  it('selects Nuuksio using its verified boundary', async () => {
    query.mockResolvedValue([{ id: 1 },{ id: 2 }]);
    const park = await controller.detail('nuuksio');
    expect(park.boundaryId).toBe('KPU010030');
    expect(park.locationIds).toEqual([1,2]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ST_Covers'), [JSON.stringify(park.geometry)]);
  });
  it('selects Lemmenjoki locations with its verified boundary', async () => {
    query.mockResolvedValue([{ id: 200 }]);
    const park = await controller.detail('lemmenjoki');
    expect(park.boundaryId).toBe('KPU120024');
    expect(park.locationIds).toEqual([200]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ST_Covers'), [JSON.stringify(park.geometry)]);
  });
  it('selects Oulanka with its verified boundary', async () => {
    query.mockResolvedValue([{ id: 200 }]);
    const park = await controller.detail('oulanka');
    expect(park.boundaryId).toBe('KPU110020');
    expect(park.locationIds).toEqual([200]);
  });
  it('selects Koli using its verified boundary', async () => {
    query.mockResolvedValue([{ id: 300 }]);
    const park = await controller.detail('koli');
    expect(park.boundaryId).toBe('KPU070027');
    expect(park.locationIds).toEqual([300]);
  });
  it('selects Repovesi using its verified boundary', async () => {
    query.mockResolvedValue([{ id: 400 }]);
    const park = await controller.detail('repovesi');
    expect(park.boundaryId).toBe('KPU050034');
    expect(park.locationIds).toEqual([400]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ST_Covers'), [JSON.stringify(park.geometry)]);
  });
  it('returns Seitseminen and its coverage explanation even without locations', async () => {
    query.mockResolvedValue([]);
    const park = await controller.detail('seitseminen');
    expect(park.locationIds).toEqual([]);
    expect(park.boundaryId).toBe('KPU040004');
    expect(park.coverage).toContain('rajattu OpenStreetMap-otos');
  });
});
