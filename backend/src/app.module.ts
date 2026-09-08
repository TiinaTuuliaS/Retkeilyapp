import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocationsModule } from './locations/locations.module';
import { ReportsModule } from './reports/reports.module';
import { getDatabaseConfig } from '../database.config';

const database = getDatabaseConfig();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: database.host,
      port: database.port,
      username: database.user,
      password: database.password,
      database: database.database,
      autoLoadEntities: true,
      synchronize: false,
    }),
    LocationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
