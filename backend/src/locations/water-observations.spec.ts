import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from './location.entity';
import { WaterObservationsService } from './water-observations.service';

describe('Water observations HTTP', () => {
  let app: INestApplication;
  const repo = { findOneBy: jest.fn(), query: jest.fn() };
  const valid = { kind: 'well', directions: ' Polun vieressä ', availability: 'unknown', observedOn: '2026-01-01' };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [LocationsController], providers: [
      WaterObservationsService,
      { provide: LocationsService, useValue: {} },
      { provide: getRepositoryToken(Location), useValue: repo },
    ] }).compile();
    app = module.createNestApplication(); await app.init();
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => {
    jest.resetAllMocks();
    repo.findOneBy.mockResolvedValue({ id: 54 });
    repo.query.mockResolvedValue([{ id: 1, locationId: 54, ...valid, directions: 'Polun vieressä' }]);
  });
  it('adds an observation to a location without requiring LIPAS water metadata', async () => {
    const response = await request(app.getHttpServer()).post('/locations/54/water-observations').send(valid).expect(201);
    expect(response.body.locationId).toBe(54);
    expect(repo.query).toHaveBeenCalledTimes(1);
    expect(repo.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO public.water_observations'),
      [54, 'well', 'Polun vieressä', 'unknown', '2026-01-01']);
  });
  it.each([
    { ...valid, id: 9 }, { ...valid, user_id: 20 }, { ...valid, locationId: 2 },
    { ...valid, kind: 'river' }, { ...valid, availability: 'drinkable' },
    { ...valid, directions: '  ' }, { ...valid, directions: 'a'.repeat(1001) },
    { ...valid, observedOn: '2026-02-30' }, { ...valid, observedOn: '2999-01-01' },
    { ...valid, observedOn: null }, { ...valid, createdAt: '2026-01-01' },
    {}, [valid],
  ])('rejects invalid or client-controlled data: %j', async body => {
    await request(app.getHttpServer()).post('/locations/54/water-observations').send(body).expect(400);
    expect(repo.query).not.toHaveBeenCalled();
    expect(repo.findOneBy).not.toHaveBeenCalled();
  });
  it('returns 404 without inserting for a missing location', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await request(app.getHttpServer()).post('/locations/54/water-observations').send(valid).expect(404);
    expect(repo.query).not.toHaveBeenCalled();
  });
  it('lists only the requested location with observation date ordering', async () => {
    await request(app.getHttpServer()).get('/locations/54/water-observations').expect(200);
    expect(repo.query).toHaveBeenCalledWith(expect.stringContaining('WHERE location_id=$1 ORDER BY observed_on DESC'), [54]);
  });
  it.each(['-1','abc','2147483648'])('rejects invalid location %s', async id => {
    await request(app.getHttpServer()).get(`/locations/${id}/water-observations`).expect(400);
    expect(repo.query).not.toHaveBeenCalled();
  });
});
