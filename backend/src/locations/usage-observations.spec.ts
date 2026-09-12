import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { parseUsageObservation, UsageObservationsService } from './usage-observations.service';
const valid = { status: 'in_use', comment: '  Kohde oli käytössä.  ', observedOn: '2026-01-01' };
describe('Usage observations', () => {
  it.each([
    { ...valid, id: 1 }, { ...valid, sourceStatus: 'active' }, { ...valid, user_id: 7 },
    { ...valid, status: 'active' }, { ...valid, observedOn: '2026-02-30' },
    { ...valid, observedOn: '2999-01-01' }, { ...valid, comment: ' ' },
  ])('rejects invalid fields or dates', input => {
    expect(() => parseUsageObservation(input)).toThrow(BadRequestException);
  });
  it('inserts an independent dated observation with server-selected location and user', async () => {
    const repo = { findOneBy: jest.fn().mockResolvedValue({ id: 18 }), query: jest.fn().mockResolvedValue([{ id: 1, locationId: 18 }]) };
    const service = new UsageObservationsService(repo as unknown as Repository<Location>);
    await service.create(18, valid);
    expect(repo.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO public.usage_observations'), [18,'in_use','Kohde oli käytössä.','2026-01-01']);
    expect(repo.query.mock.calls[0][0]).not.toMatch(/UPDATE|location_sources/);
  });
  it('rejects unknown locations without writing', async () => {
    const repo = { findOneBy: jest.fn().mockResolvedValue(null), query: jest.fn() };
    await expect(new UsageObservationsService(repo as unknown as Repository<Location>).create(99,valid)).rejects.toThrow(NotFoundException);
    expect(repo.query).not.toHaveBeenCalled();
  });
});
