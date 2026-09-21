import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { BinanceP2pPort } from './ports/binance-p2p.port.js';
import { BinanceP2pAdapter } from './adapters/binance-p2p.binance-api.js';

import { MonitorConfigRepositoryPort } from './ports/monitor-config-repository.port.js';
import { FileMonitorConfigRepositoryAdapter } from './adapters/file-monitor-config-repository.adapter.js';

import { AuditSnapshotRepositoryPort } from './ports/audit-snapshot-repository.port.js';
import { FileAuditSnapshotRepositoryAdapter } from './adapters/file-audit-snapshot-repository.adapter.js';

import { LiveOffersService } from './services/live-offers.service.js';
import { LiveOffersController } from './controllers/live-offers.controller.js';

import { MonitorConfigService } from './services/monitor-config.service.js';
import { MonitorSchedulerService } from './services/monitor-scheduler.service.js';
import { MonitorHistoryService } from './services/monitor-history.service.js';
import { MonitorController } from './controllers/monitor.controller.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot()],
  controllers: [AppController, LiveOffersController, MonitorController],
  providers: [
    AppService,
    LiveOffersService,
    MonitorConfigService,
    MonitorSchedulerService,
    MonitorHistoryService,
    {
      provide: BinanceP2pPort,
      useClass: BinanceP2pAdapter,
    },
    {
      provide: MonitorConfigRepositoryPort,
      useClass: FileMonitorConfigRepositoryAdapter,
    },
    {
      provide: AuditSnapshotRepositoryPort,
      useClass: FileAuditSnapshotRepositoryAdapter,
    },
  ],
})
export class AppModule {}
