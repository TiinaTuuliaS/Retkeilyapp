import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

export function parseWaterObservation(value: unknown) {
  const fail = (message: string): never => { throw new BadRequestException(message); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Ilmoituksen pitää olla JSON-objekti.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['kind','directions','availability','observedOn'].includes(key))) return fail('Ilmoituksessa on ylimääräisiä kenttiä.');
  if (typeof input.kind !== 'string' || !['tap','well','spring','other'].includes(input.kind)) return fail('Valitse vesipisteen tyyppi.');
  if (typeof input.directions !== 'string' || !input.directions.trim() || input.directions.length > 1000) return fail('Kerro vesipisteen sijainti, enintään 1000 merkkiä.');
  if (typeof input.availability !== 'string' || !['available','unavailable','unknown'].includes(input.availability)) return fail('Valitse veden saatavuus.');
  const date = input.observedOn;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Anna käyntipäivä muodossa VVVV-KK-PP.');
  const parsed = new Date(`${date}T00:00:00Z`);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date || date < '2000-01-01' || date > today) return fail('Anna todellinen käyntipäivä, joka ei ole tulevaisuudessa.');
  return { kind: input.kind, directions: input.directions.trim(), availability: input.availability, observedOn: date };
}

@Injectable()
export class WaterObservationsService {
  constructor(@InjectRepository(Location) private locations: Repository<Location>) {}
  private async checkLocation(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new BadRequestException('Virheellinen kohdetunniste.');
    if (!await this.locations.findOneBy({ id })) throw new NotFoundException('Retkikohdetta ei löydy.');
  }
  async find(id: number) {
    await this.checkLocation(id);
    return this.locations.query(`SELECT id, location_id AS "locationId", kind, directions, availability,
      to_char(observed_on,'YYYY-MM-DD') AS "observedOn", created_at AS "createdAt"
      FROM public.water_observations WHERE location_id=$1 ORDER BY observed_on DESC, created_at DESC, id DESC`, [id]);
  }
  async create(id: number, value: unknown) {
    const input = parseWaterObservation(value);
    await this.checkLocation(id);
    // Development demo user, same as reports; authentication is not implemented yet.
    const rows = await this.locations.query(`INSERT INTO public.water_observations
      (location_id,user_id,kind,directions,availability,observed_on) VALUES ($1,1,$2,$3,$4,$5)
      RETURNING id, location_id AS "locationId", kind, directions, availability,
      to_char(observed_on,'YYYY-MM-DD') AS "observedOn", created_at AS "createdAt"`,
    [id, input.kind, input.directions, input.availability, input.observedOn]);
    return rows[0];
  }
}
