import { describe, expect, it, vi } from 'vitest';
import { MonitorConfigService } from './monitor-config.service.js';
import { MonitorConfigRepositoryPort } from '../ports/monitor-config-repository.port.js';
import { MonitorCronConfig } from '../domain/monitor-cron.domain.js';

describe('MonitorConfigService', () => {
  const sampleMonitors: MonitorCronConfig[] = [
    {
      id: 'm1',
      name: 'Monitor Banesco',
      enabled: true,
      cronIntervalMs: 30000,
      queryFilter: { fiat: 'VES', asset: 'USDT', tradeType: 'BUY', payTypes: ['Banesco'], rows: 10 },
      retentionPolicy: { retentionHours: 24 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('debe listar todos los monitores', async () => {
    const mockRepo: MonitorConfigRepositoryPort = {
      findAll: vi.fn().mockResolvedValue(sampleMonitors),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const service = new MonitorConfigService(mockRepo);
    const monitors = await service.getAllMonitors();
    expect(monitors.length).toBe(1);
    expect(monitors[0].name).toBe('Monitor Banesco');
  });

  it('debe crear un nuevo monitor con valores saneados', async () => {
    let savedConfig: MonitorCronConfig | null = null;
    const mockRepo: MonitorConfigRepositoryPort = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      save: vi.fn().mockImplementation(async (cfg) => {
        savedConfig = cfg;
      }),
      delete: vi.fn(),
    };

    const service = new MonitorConfigService(mockRepo);
    const created = await service.createMonitor({
      name: 'Monitor Provincial',
      cronIntervalMs: 15000,
      queryFilter: { payTypes: ['Provincial'] },
    });

    expect(created.name).toBe('Monitor Provincial');
    expect(created.queryFilter.payTypes).toContain('Provincial');
    expect(savedConfig).not.toBeNull();
  });

  it('debe crear y actualizar monitor con filtro transAmount', async () => {
    let savedConfig: MonitorCronConfig | null = null;
    const mockRepo: MonitorConfigRepositoryPort = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockImplementation(async (id) => savedConfig),
      save: vi.fn().mockImplementation(async (cfg) => {
        savedConfig = cfg;
      }),
      delete: vi.fn(),
    };

    const service = new MonitorConfigService(mockRepo);
    const created = await service.createMonitor({
      name: 'Monitor Con Filtro Monto API',
      cronIntervalMs: 15000,
      queryFilter: {
        payTypes: ['Banesco'],
        transAmount: 5000,
      },
    });

    expect(created.queryFilter.transAmount).toBe(5000);

    const updated = await service.updateMonitor(created.id, {
      queryFilter: {
        transAmount: 10000,
      },
    });

    expect(updated.queryFilter.transAmount).toBe(10000);
  });
});
