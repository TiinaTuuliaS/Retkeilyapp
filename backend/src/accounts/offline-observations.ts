import { BadRequestException, Body, ConflictException, Controller, Injectable, Post, Req } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isDeepStrictEqual } from 'node:util';
import { Report } from '../reports/report.entity';
import { Location } from '../locations/location.entity';
import { ReportsService } from '../reports/reports.service';
import { WaterObservationsService } from '../locations/water-observations.service';
import { UsageObservationsService } from '../locations/usage-observations.service';

@Injectable()
export class OfflineObservationsService {
  constructor(private db:DataSource) {}
  async submit(owner:number,value:unknown) {
    if(!value || typeof value!=='object' || Array.isArray(value)) throw new BadRequestException('Virheellinen havainto.');
    const b=value as Record<string,any>;
    if(Object.keys(b).some(k=>!['requestId','kind','locationId','data','accountId'].includes(k)) || b.accountId!==owner) throw new BadRequestException('Havainto kuuluu toiselle tilille.');
    if(typeof b.requestId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.requestId)) throw new BadRequestException('Virheellinen lähetyksen tunniste.');
    if(!['report','water','usage'].includes(b.kind) || !Number.isInteger(b.locationId) || b.locationId<1 || b.locationId>2147483647) throw new BadRequestException('Virheellinen kohde tai havaintotyyppi.');
    return this.db.transaction(async manager=>{
      // Serialize a user's retries. Receipt and observation commit together, even
      // if the HTTP response is lost or two browser tabs submit concurrently.
      await manager.query('SELECT pg_advisory_xact_lock(915009,$1)',[owner]);
      const [receipt]=await manager.query('SELECT payload,response FROM public.observation_receipts WHERE account_id=$1 AND request_id=$2',[owner,b.requestId]);
      if(receipt) {
        if(!isDeepStrictEqual(receipt.payload,b)) throw new ConflictException('Samaa lähetyksen tunnistetta käytettiin eri havainnolle.');
        return receipt.response;
      }
      const repo=manager.getRepository(Location);
      let result;
      if(b.kind==='report') {
        if(b.data?.location?.id!==b.locationId) throw new BadRequestException('Kohdetunnisteet eivät vastaa toisiaan.');
        result=await new ReportsService(manager.getRepository(Report),repo).create(b.data,owner);
      } else if(b.kind==='water') result=await new WaterObservationsService(repo).create(b.locationId,b.data,owner);
      else result=await new UsageObservationsService(repo).create(b.locationId,b.data,owner);
      await manager.query('INSERT INTO public.observation_receipts(account_id,request_id,payload,response) VALUES($1,$2,$3,$4)',[owner,b.requestId,JSON.stringify(b),JSON.stringify(result)]);
      return result;
    });
  }
}
@Controller('account/observations')
export class OfflineObservationsController {
  constructor(private service:OfflineObservationsService) {}
  @Post() submit(@Req() req,@Body() body:unknown) { return this.service.submit(req.account.id,body); }
}
