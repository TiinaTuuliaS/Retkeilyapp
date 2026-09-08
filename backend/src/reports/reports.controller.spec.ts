import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './report.entity';
import { Location } from '../locations/location.entity';

describe('Report HTTP validation (no database)', () => {
  let app: INestApplication;
  const locations = { findOneBy: jest.fn(), query: jest.fn() };
  const reports = { insert: jest.fn(), findOneOrFail: jest.fn() };
  const valid = { location: { id: 2 }, status: 'ok', comment: 'Kunnossa' };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: reports },
        { provide: getRepositoryToken(Location), useValue: locations },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    locations.findOneBy.mockResolvedValue({ id: 2, name: 'Testikohde' });
    reports.insert.mockResolvedValue({ identifiers: [{ id: 99 }] });
    reports.findOneOrFail.mockResolvedValue({ ...valid, id: 99, target: 'general', user_id: 1 });
  });
  afterAll(async () => { await app.close(); });

  it('creates a new report and returns its location', async () => {
    const result = await request(app.getHttpServer()).post('/reports').send(valid).expect(201);
    expect(result.body.id).toBe(99);
    expect(result.body.location.id).toBe(2);
    expect(reports.insert).toHaveBeenCalledWith({ ...valid, target: 'general', user_id: 1 });
  });

  it.each([
    ['invalid target', { ...valid, target: 'free_use' }],
    ['null target', { ...valid, target: null }],
    ['multiple targets', { ...valid, target: ['general', 'toilet'] }],
    ['existing report id', { ...valid, id: 7 }],
    ['client-selected user', { ...valid, user_id: 20 }],
    ['extra field', { ...valid, unexpected: true }],
    ['invalid status', { ...valid, status: 'anything' }],
    ['missing status', { location: { id: 2 } }],
    ['missing location', { status: 'ok' }],
    ['null location', { ...valid, location: null }],
    ['string location id', { ...valid, location: { id: '2' } }],
    ['negative location id', { ...valid, location: { id: -1 } }],
    ['fractional location id', { ...valid, location: { id: 1.5 } }],
    ['out-of-range location id', { ...valid, location: { id: 2147483648 } }],
    ['nested extra field', { ...valid, location: { id: 2, name: 'Changed' } }],
    ['non-text comment', { ...valid, comment: 123 }],
    ['oversized comment', { ...valid, comment: 'x'.repeat(2001) }],
    ['batch input', [valid]],
  ])('rejects %s before accessing the database', async (_label, body) => {
    await request(app.getHttpServer()).post('/reports').send(body).expect(400);
    expect(locations.findOneBy).not.toHaveBeenCalled();
    expect(reports.insert).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing location without writing a report', async () => {
    locations.findOneBy.mockResolvedValue(null);
    await request(app.getHttpServer()).post('/reports').send(valid).expect(404);
    expect(reports.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['toilet', { toilet: true }],
    ['water', { water_point: 'seasonal' }],
    ['water', { water_point: 'year-round' }],
  ])('saves a report for a known %s service', async (target, metadata) => {
    locations.query.mockResolvedValueOnce([{ name: 'location_sources' }])
      .mockResolvedValueOnce([{ metadata }]);
    reports.findOneOrFail.mockResolvedValue({ ...valid, target, id: 99 });
    const response = await request(app.getHttpServer()).post('/reports')
      .send({ ...valid, target }).expect(201);
    expect(response.body.target).toBe(target);
    expect(reports.insert).toHaveBeenCalledWith({ ...valid, target, user_id: 1 });
    expect(locations.query).toHaveBeenLastCalledWith(expect.stringContaining('location_id=$1'), [2]);
  });

  it.each([
    ['toilet', { toilet: false }],
    ['toilet', {}],
    ['water', {}],
    ['water', { water_point: 'unknown' }],
  ])('rejects an unavailable %s service without saving', async (target, metadata) => {
    locations.query.mockResolvedValueOnce([{ name: 'location_sources' }])
      .mockResolvedValueOnce([{ metadata }]);
    await request(app.getHttpServer()).post('/reports').send({ ...valid, target }).expect(400);
    expect(reports.insert).not.toHaveBeenCalled();
  });

  it('rejects service targeting when source data has not been installed', async () => {
    locations.query.mockResolvedValueOnce([{ name: null }]);
    await request(app.getHttpServer()).post('/reports').send({ ...valid, target: 'toilet' }).expect(400);
    expect(reports.insert).not.toHaveBeenCalled();
  });

  it('allows an omitted comment and the not_ok status', async () => {
    await request(app.getHttpServer()).post('/reports')
      .send({ location: { id: 2 }, status: 'not_ok' }).expect(201);
    expect(reports.insert).toHaveBeenCalledWith({
      location: { id: 2 }, status: 'not_ok', comment: '', target: 'general', user_id: 1,
    });
  });
});
