import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { BinanceVesPort } from './ports/binance-ves.port.js';
import { BinanceAdapter } from './adapters/binance-ves.binance-api.js';

import { AdvertisingRepositoryPort } from './ports/advertising-repository.port.js';
import { FileAdvertisingRepositoryAdapter } from './adapters/file-advertising-repository.adapter.js';

import { AdvertisingCronService } from './services/advertising-cron.service.js';
import { AdvertisingQueryService } from './services/advertising-query.service.js';
import { AdvertisingController } from './controllers/advertising.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, AdvertisingController],
  providers: [
    AppService,
    AdvertisingCronService,
    AdvertisingQueryService,
    {
      provide: BinanceVesPort,
      useClass: BinanceAdapter,
    },
    {
      provide: AdvertisingRepositoryPort,
      useClass: FileAdvertisingRepositoryAdapter,
    },
  ],
})
export class AppModule {}
