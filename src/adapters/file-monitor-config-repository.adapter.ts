import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { MonitorCronConfig } from '../domain/monitor-cron.domain.js';
import { MonitorConfigRepositoryPort } from '../ports/monitor-config-repository.port.js';

@Injectable()
export class FileMonitorConfigRepositoryAdapter implements MonitorConfigRepositoryPort {
  private readonly logger = new Logger(FileMonitorConfigRepositoryAdapter.name);
  private readonly filePath = path.join(process.cwd(), 'data', 'monitors_config.json');

  private async ensureFile(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.access(this.filePath);
    } catch {
      const defaultMonitor: MonitorCronConfig = {
        id: 'default-ves-usdt',
        name: 'Monitor Principal VES/USDT',
        enabled: true,
        cronIntervalMs: 60000,
        queryFilter: {
          fiat: 'VES',
          asset: 'USDT',
          tradeType: 'BUY',
          payTypes: ['Banesco', 'PagoMovil'],
          rows: 20,
        },
        retentionPolicy: {
          retentionHours: 48,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(this.filePath, JSON.stringify([defaultMonitor], null, 2), 'utf-8');
    }
  }

  public async findAll(): Promise<MonitorCronConfig[]> {
    await this.ensureFile();
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as MonitorCronConfig[];
    } catch (err) {
      this.logger.error(`Error al leer configuraciones de monitores: ${err}`);
      return [];
    }
  }

  public async findById(id: string): Promise<MonitorCronConfig | null> {
    const all = await this.findAll();
    return all.find((m) => m.id === id) || null;
  }

  public async save(config: MonitorCronConfig): Promise<void> {
    const all = await this.findAll();
    const index = all.findIndex((m) => m.id === config.id);
    if (index >= 0) {
      all[index] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      all.push(config);
    }
    await fs.writeFile(this.filePath, JSON.stringify(all, null, 2), 'utf-8');
  }

  public async delete(id: string): Promise<boolean> {
    const all = await this.findAll();
    const filtered = all.filter((m) => m.id !== id);
    if (filtered.length === all.length) {
      return false;
    }
    await fs.writeFile(this.filePath, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
}
