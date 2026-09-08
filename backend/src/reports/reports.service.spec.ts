import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Report } from './report.entity';
import { Location } from '../locations/location.entity';

describe('ReportsService', () => {
  it('returns the newly inserted report with full location data', async () => {
    const location = { id: 2, name: 'Testikohde' };
    const saved = { id: 99, location, status: 'ok', comment: 'Testi', target: 'general', user_id: 1 };
    const reports = {
      insert: jest.fn().mockResolvedValue({ identifiers: [{ id: 99 }] }),
      findOneOrFail: jest.fn().mockResolvedValue(saved),
    };
    const locations = { findOneBy: jest.fn().mockResolvedValue(location) };
    const service = new ReportsService(
      reports as unknown as Repository<Report>,
      locations as unknown as Repository<Location>,
    );
    await expect(service.create({ location: { id: 2 }, status: 'ok', comment: ' Testi ' }))
      .resolves.toEqual(saved);
    expect(reports.insert).toHaveBeenCalledWith({
      location: { id: 2 }, status: 'ok', comment: 'Testi', target: 'general', user_id: 1,
    });
    expect(reports.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 99 }, relations: ['location'],
    });
  });
});
