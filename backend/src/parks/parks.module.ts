import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/location.entity';
import { ParksController } from './parks.controller';

@Module({ imports: [TypeOrmModule.forFeature([Location])], controllers: [ParksController] })
export class ParksModule {}
