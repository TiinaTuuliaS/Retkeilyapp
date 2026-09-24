import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: unknown, @Req() req: any) {
    return this.service.create(data, req.account?.id);
  }
}
