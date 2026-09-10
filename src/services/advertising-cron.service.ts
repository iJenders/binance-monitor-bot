import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { BinanceVesPort } from '../ports/binance-ves.port.js';
import { AdvertisingRepositoryPort } from '../ports/advertising-repository.port.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';

@Injectable()
export class AdvertisingCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdvertisingCronService.name);
  private timerHandle?: NodeJS.Timeout;

  constructor(
    private readonly binanceVesPort: BinanceVesPort,
    private readonly advertisingRepositoryPort: AdvertisingRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs = Number(this.configService.get<number>('CRON_INTERVAL_MS', 60000));
    this.logger.log(`Inicializando servicio Cron de anuncios. Intervalo: ${intervalMs} ms`);

    // Ejecución inicial al arrancar
    this.fetchAndStoreAdvertisings();

    // Programar ejecuciones periódicas
    this.timerHandle = setInterval(() => {
      this.fetchAndStoreAdvertisings();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
    }
  }

  public async fetchAndStoreAdvertisings(): Promise<void> {
    try {
      this.logger.log('Ejecutando tarea Cron: Obteniendo ofertas de Binance P2P...');
      const advertisings = await this.binanceVesPort.getBinanceOffers();

      const snapshot: AdvertisingSnapshot = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        records: advertisings,
      };

      await this.advertisingRepositoryPort.saveSnapshot(snapshot);
      this.logger.log(`Tarea Cron completada exitosamente. Total registros almacenados: ${advertisings.length}`);
    } catch (error) {
      this.logger.error(`Error durante la ejecución del Cron de anuncios: ${error}`);
    }
  }
}
