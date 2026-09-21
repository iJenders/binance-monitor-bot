import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MonitorConfigService } from './monitor-config.service.js';
import { BinanceP2pPort } from '../ports/binance-p2p.port.js';
import { AuditSnapshotRepositoryPort } from '../ports/audit-snapshot-repository.port.js';
import { AuditSnapshot } from '../domain/audit-snapshot.domain.js';
import { MonitorCronConfig } from '../domain/monitor-cron.domain.js';

@Injectable()
export class MonitorSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitorSchedulerService.name);
  private syncTimerHandle?: NodeJS.Timeout;
  private readonly runningTasks = new Set<string>();
  private readonly lastRunTimestamps = new Map<string, number>();

  constructor(
    private readonly monitorConfigService: MonitorConfigService,
    private readonly binanceP2pPort: BinanceP2pPort,
    private readonly snapshotRepositoryPort: AuditSnapshotRepositoryPort,
  ) {}

  onModuleInit() {
    this.logger.log(
      'Inicializando programador dinámico de Crons de Monitoreo.',
    );
    // Check every 1 second for due monitor tasks
    this.syncTimerHandle = setInterval(() => {
      void this.checkAndRunMonitors();
    }, 1000);
  }

  onModuleDestroy() {
    if (this.syncTimerHandle) {
      clearInterval(this.syncTimerHandle);
    }
  }

  private async checkAndRunMonitors(): Promise<void> {
    try {
      const monitors = await this.monitorConfigService.getAllMonitors();
      const activeMonitors = monitors.filter((m) => m.enabled);
      const now = Date.now();

      for (const monitor of activeMonitors) {
        const lastRun = this.lastRunTimestamps.get(monitor.id) || 0;
        const isDue = lastRun === 0 || now - lastRun >= monitor.cronIntervalMs;

        if (isDue && !this.runningTasks.has(monitor.id)) {
          this.lastRunTimestamps.set(monitor.id, now);
          void this.executeMonitorTick(monitor);
        }
      }
    } catch (err) {
      this.logger.error(`Error en ciclo de chequeo de monitores: ${err}`);
    }
  }

  public async triggerMonitorNow(id: string): Promise<AuditSnapshot> {
    const monitor = await this.monitorConfigService.getMonitorById(id);
    return this.executeMonitorTick(monitor);
  }

  public async executeMonitorTick(
    monitor: MonitorCronConfig,
  ): Promise<AuditSnapshot> {
    if (this.runningTasks.has(monitor.id)) {
      this.logger.warn(
        `El monitor '${monitor.name}' [${monitor.id}] ya tiene una tarea en ejecución.`,
      );
      throw new Error(`Monitor ${monitor.id} ya se encuentra en ejecución.`);
    }

    this.runningTasks.add(monitor.id);
    const startTime = Date.now();
    let snapshot: AuditSnapshot;

    try {
      this.logger.log(
        `Ejecutando Cron Monitor '${monitor.name}' [${monitor.id}]: asset=${monitor.queryFilter.asset}, fiat=${monitor.queryFilter.fiat}, payTypes=${monitor.queryFilter.payTypes.join(',') || 'todos'}`,
      );

      const fetchResult = await this.binanceP2pPort.getBinanceOffers(
        monitor.queryFilter,
      );

      snapshot = {
        id: randomUUID(),
        monitorId: monitor.id,
        monitorName: monitor.name,
        timestamp: new Date().toISOString(),
        executionDurationMs: fetchResult.executionDurationMs,
        status: 'SUCCESS',
        auditTrail: fetchResult.auditTrail,
        records: fetchResult.records,
      };

      await this.snapshotRepositoryPort.saveSnapshot(snapshot);

      // Purge old snapshots for this monitor if retention policy configured
      if (monitor.retentionPolicy.retentionHours > 0) {
        const cutoff = new Date(
          Date.now() - monitor.retentionPolicy.retentionHours * 60 * 60 * 1000,
        );
        const removed = await this.snapshotRepositoryPort.purgeOlderThan(
          monitor.id,
          cutoff,
        );
        if (removed > 0) {
          this.logger.log(
            `Depurados ${removed} snapshots antiguos para monitor '${monitor.name}'.`,
          );
        }
      }

      return snapshot;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Fallo en ejecución de Monitor '${monitor.name}': ${error.message || error}`,
      );

      snapshot = {
        id: randomUUID(),
        monitorId: monitor.id,
        monitorName: monitor.name,
        timestamp: new Date().toISOString(),
        executionDurationMs: duration,
        status: 'FAILURE',
        errorMessage: error.message || String(error),
        auditTrail: {
          requestUrl:
            'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
          requestPayload: { ...monitor.queryFilter, page: 1 },
          httpStatus: error.message?.includes('HTTP')
            ? parseInt(error.message.replace(/\D/g, ''), 10) || 500
            : 500,
          recordsCount: 0,
        },
        records: [],
      };

      await this.snapshotRepositoryPort.saveSnapshot(snapshot);
      return snapshot;
    } finally {
      this.runningTasks.delete(monitor.id);
    }
  }
}
