import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Location } from '../locations/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Location])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
