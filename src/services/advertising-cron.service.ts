import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BinanceVesPort } from '../ports/binance-ves.port.js';
import { AdvertisingRepositoryPort } from '../ports/advertising-repository.port.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';
import { AppSettingsService } from './app-settings.service.js';

@Injectable()
export class AdvertisingCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdvertisingCronService.name);
  private timerHandle?: NodeJS.Timeout;
  private lastRunAt = 0;
  private running = false;

  constructor(
    private readonly binanceVesPort: BinanceVesPort,
    private readonly advertisingRepositoryPort: AdvertisingRepositoryPort,
    private readonly appSettings: AppSettingsService,
  ) {}

  onModuleInit() {
    this.logger.log('Inicializando servicio Cron de anuncios.');
    this.timerHandle = setInterval(() => {
      void this.tick();
    }, 1000);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
    }
  }

  private async tick(): Promise<void> {
    const settings = await this.appSettings.get();
    const isDue = this.lastRunAt === 0 || Date.now() - this.lastRunAt >= settings.cronIntervalMs;
    if (!isDue) {
      return;
    }

    this.lastRunAt = Date.now();
    await this.fetchAndStoreAdvertisings();
  }

  public async fetchAndStoreAdvertisings(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const settings = await this.appSettings.get();
      this.logger.log(
        `Ejecutando tarea Cron: ofertas=${settings.offersRows}, bancos=${settings.payTypes.length ? settings.payTypes.join(',') : 'todos'}, retención=${settings.retentionHours}h`,
      );

      const advertisings = await this.binanceVesPort.getBinanceOffers({
        rows: settings.offersRows,
        payTypes: settings.payTypes,
      });

      const snapshot: AdvertisingSnapshot = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        records: advertisings,
      };

      await this.advertisingRepositoryPort.saveSnapshot(snapshot);
      this.logger.log(`Tarea Cron completada exitosamente. Total registros almacenados: ${advertisings.length}`);

      if (settings.retentionHours > 0) {
        const cutoff = new Date(Date.now() - settings.retentionHours * 60 * 60 * 1000);
        const removed = await this.advertisingRepositoryPort.purgeOlderThan(cutoff);
        if (removed > 0) {
          this.logger.log(`Se eliminaron ${removed} snapshots fuera de la ventana de retención.`);
        }
      }
    } catch (error) {
      this.logger.error(`Error durante la ejecución del Cron de anuncios: ${error}`);
    } finally {
      this.running = false;
    }
  }
}
