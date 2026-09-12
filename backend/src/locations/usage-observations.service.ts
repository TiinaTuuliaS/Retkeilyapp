import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

export function parseUsageObservation(value: unknown) {
  const fail = (message: string): never => { throw new BadRequestException(message); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Ilmoituksen pitää olla JSON-objekti.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['status','comment','observedOn'].includes(key))) return fail('Ilmoituksessa on ylimääräisiä kenttiä.');
  if (!['in_use','not_in_use','unknown'].includes(input.status as string)) return fail('Valitse havaitsemasi käyttötila.');
  if (typeof input.comment !== 'string' || !input.comment.trim() || input.comment.length > 1000) return fail('Kuvaile havaintosi, enintään 1000 merkkiä.');
  const date = input.observedOn;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Anna käyntipäivä muodossa VVVV-KK-PP.');
  const parsed = new Date(`${date}T00:00:00Z`);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date || date < '2000-01-01' || date > today) return fail('Anna todellinen käyntipäivä, joka ei ole tulevaisuudessa.');
  return { status: input.status, comment: input.comment.trim(), observedOn: date };
}

@Injectable()
export class UsageObservationsService {
  constructor(@InjectRepository(Location) private locations: Repository<Location>) {}
  private async checkLocation(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new BadRequestException('Virheellinen kohdetunniste.');
    if (!await this.locations.findOneBy({ id })) throw new NotFoundException('Retkikohdetta ei löydy.');
  }
  async find(id: number) {
    await this.checkLocation(id);
    return this.locations.query(`SELECT id, location_id AS "locationId", status, comment,
      to_char(observed_on,'YYYY-MM-DD') AS "observedOn", created_at AS "createdAt"
      FROM public.usage_observations WHERE location_id=$1 ORDER BY observed_on DESC, created_at DESC, id DESC`, [id]);
  }
  async create(id: number, value: unknown) {
    const input = parseUsageObservation(value);
    await this.checkLocation(id);
    // Development demo user, same as reports; authentication is not implemented yet.
    const rows = await this.locations.query(`INSERT INTO public.usage_observations
      (location_id,user_id,status,comment,observed_on) VALUES ($1,1,$2,$3,$4)
      RETURNING id, location_id AS "locationId", status, comment,
      to_char(observed_on,'YYYY-MM-DD') AS "observedOn", created_at AS "createdAt"`,
    [id, input.status, input.comment, input.observedOn]);
    return rows[0];
  }
}
