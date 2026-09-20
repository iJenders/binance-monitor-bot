import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MonitorConfigRepositoryPort } from '../ports/monitor-config-repository.port.js';
import { MonitorCronConfig } from '../domain/monitor-cron.domain.js';
import { VES_PAY_TYPES } from '../domain/ves-pay-types.js';

@Injectable()
export class MonitorConfigService {
  constructor(private readonly repositoryPort: MonitorConfigRepositoryPort) { }

  public async getAllMonitors(): Promise<MonitorCronConfig[]> {
    return this.repositoryPort.findAll();
  }

  public async getMonitorById(id: string): Promise<MonitorCronConfig> {
    const monitor = await this.repositoryPort.findById(id);
    if (!monitor) {
      throw new NotFoundException(`Monitor con ID '${id}' no encontrado.`);
    }
    return monitor;
  }

  public async createMonitor(dto: {
    name: string;
    cronIntervalMs: number;
    queryFilter: {
      fiat?: string;
      asset?: string;
      tradeType?: 'BUY' | 'SELL';
      payTypes?: string[];
      rows?: number;
    };
    retentionPolicy?: {
      retentionHours?: number;
    };
    enabled?: boolean;
  }): Promise<MonitorCronConfig> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('El nombre del monitor es obligatorio.');
    }

    const interval = Math.max(5000, Math.min(3600000, Number(dto.cronIntervalMs) || 60000));
    const retention = Math.max(1, Math.min(720, Number(dto.retentionPolicy?.retentionHours) || 48));
    const rows = Math.max(1, Math.min(100, Number(dto.queryFilter?.rows) || 20));

    const newConfig: MonitorCronConfig = {
      id: randomUUID(),
      name: dto.name.trim(),
      enabled: dto.enabled ?? true,
      cronIntervalMs: interval,
      queryFilter: {
        fiat: (dto.queryFilter?.fiat || 'VES').toUpperCase(),
        asset: (dto.queryFilter?.asset || 'USDT').toUpperCase(),
        tradeType: dto.queryFilter?.tradeType === 'SELL' ? 'SELL' : 'BUY',
        payTypes: Array.isArray(dto.queryFilter?.payTypes) ? dto.queryFilter.payTypes : [],
        rows,
      },
      retentionPolicy: {
        retentionHours: retention,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repositoryPort.save(newConfig);
    return newConfig;
  }

  public async updateMonitor(
    id: string,
    dto: Partial<{
      name: string;
      enabled: boolean;
      cronIntervalMs: number;
      queryFilter: Partial<MonitorCronConfig['queryFilter']>;
      retentionPolicy: Partial<MonitorCronConfig['retentionPolicy']>;
    }>,
  ): Promise<MonitorCronConfig> {
    const existing = await this.getMonitorById(id);

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('El nombre del monitor no puede estar vacío.');
      }
      existing.name = dto.name.trim();
    }

    if (dto.enabled !== undefined) {
      existing.enabled = Boolean(dto.enabled);
    }

    if (dto.cronIntervalMs !== undefined) {
      existing.cronIntervalMs = Math.max(5000, Math.min(3600000, Number(dto.cronIntervalMs) || 60000));
    }

    if (dto.queryFilter) {
      existing.queryFilter = {
        fiat: (dto.queryFilter.fiat || existing.queryFilter.fiat).toUpperCase(),
        asset: (dto.queryFilter.asset || existing.queryFilter.asset).toUpperCase(),
        tradeType: dto.queryFilter.tradeType === 'SELL' ? 'SELL' : 'BUY',
        payTypes: Array.isArray(dto.queryFilter.payTypes) ? dto.queryFilter.payTypes : existing.queryFilter.payTypes,
        rows: Math.max(1, Math.min(100, Number(dto.queryFilter.rows) || existing.queryFilter.rows)),
      };
    }

    if (dto.retentionPolicy?.retentionHours !== undefined) {
      existing.retentionPolicy.retentionHours = Math.max(
        1,
        Math.min(720, Number(dto.retentionPolicy.retentionHours) || existing.retentionPolicy.retentionHours),
      );
    }

    existing.updatedAt = new Date().toISOString();
    await this.repositoryPort.save(existing);
    return existing;
  }

  public async deleteMonitor(id: string): Promise<void> {
    const deleted = await this.repositoryPort.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Monitor con ID '${id}' no existe.`);
    }
  }

  public getPayTypesCatalog() {
    return VES_PAY_TYPES;
  }
}
