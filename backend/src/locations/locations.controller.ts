import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { WaterObservationsService } from './water-observations.service';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private service: LocationsService, private water: WaterObservationsService) {}

  @Get(':id/water-observations')
  getWater(@Param('id', ParseIntPipe) id: number) { return this.water.find(id); }

  @Post(':id/water-observations')
  addWater(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) { return this.water.create(id, body); }

  @Get()
  getAll() {
    return this.service.findAll();
  }
}
