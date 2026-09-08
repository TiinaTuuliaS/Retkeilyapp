import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { WaterObservationsService } from './water-observations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [LocationsService, WaterObservationsService],
  controllers: [LocationsController],
})
export class LocationsModule {}
