import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { Location } from '../locations/location.entity';
import { parseCreateReport } from './create-report';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private repo: Repository<Report>,
    @InjectRepository(Location)
    private locations: Repository<Location>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['location'],
    });
  }

  async create(data: unknown, accountId?: number) {
    const input = parseCreateReport(data);
    const location = await this.locations.findOneBy({ id: input.location.id });
    if (!location) {
      throw new NotFoundException('Valittua retkikohdetta ei löydy.');
    }

    if (input.target !== 'general') {
      const available = await this.locations.query("SELECT to_regclass('public.location_sources') AS name");
      const sources = available[0]?.name ? await this.locations.query(
        `SELECT metadata FROM public.location_sources
         WHERE location_id=$1 AND source='lipas' AND source_collection='sports-sites'
         ORDER BY imported_at DESC LIMIT 1`, [location.id],
      ) : [];
      const metadata = sources[0]?.metadata ?? {};
      const allowed = input.target === 'toilet' ? metadata.toilet === true
        : ['year-round', 'seasonal'].includes(metadata.water_point);
      if (!allowed) throw new BadRequestException('Tästä palvelusta ei ole kohteessa vahvistettua tietoa. Valitse yleinen arvio.');
    }

    // Legacy user_id retained for compatibility; account_id owns authenticated reports.
    const report = {
      location: { id: location.id },
      user_id: 1,
      ...(accountId ? { account_id: accountId } : {}),
      status: input.status,
      target: input.target,
      comment: input.comment,
    };
    const result = await this.repo.insert(report);
    return this.repo.findOneOrFail({
      where: { id: result.identifiers[0].id },
      relations: ['location'],
    });
  }
}
