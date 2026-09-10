import { describe, expect, it, vi } from 'vitest';
import { MonitorSchedulerService } from './monitor-scheduler.service.js';
import { MonitorConfigService } from './monitor-config.service.js';
import { BinanceP2pPort } from '../ports/binance-p2p.port.js';
import { AuditSnapshotRepositoryPort } from '../ports/audit-snapshot-repository.port.js';
import { MonitorCronConfig } from '../domain/monitor-cron.domain.js';

describe('MonitorSchedulerService', () => {
  const testMonitor: MonitorCronConfig = {
    id: 'm-test',
    name: 'Test Monitor',
    enabled: true,
    cronIntervalMs: 60000,
    queryFilter: { fiat: 'VES', asset: 'USDT', tradeType: 'BUY', payTypes: ['Banesco'], rows: 10 },
    retentionPolicy: { retentionHours: 48 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('debe ejecutar una recolección e ingresar snapshot auditado', async () => {
    const mockConfigService = {
      getMonitorById: vi.fn().mockResolvedValue(testMonitor),
      getAllMonitors: vi.fn().mockResolvedValue([testMonitor]),
    } as unknown as MonitorConfigService;

    const mockBinancePort: BinanceP2pPort = {
      getBinanceOffers: vi.fn().mockResolvedValue({
        records: [
          {
            adv: { price: '45.0' },
          },
        ],
        executionDurationMs: 120,
        auditTrail: {
          requestUrl: 'https://p2p.binance.com',
          requestPayload: {},
          httpStatus: 200,
          recordsCount: 1,
        },
      }),
    };

    let savedSnapshot: any = null;
    const mockSnapshotRepo: AuditSnapshotRepositoryPort = {
      saveSnapshot: vi.fn().mockImplementation(async (snap) => {
        savedSnapshot = snap;
      }),
      findByMonitor: vi.fn().mockResolvedValue([]),
      purgeOlderThan: vi.fn().mockResolvedValue(0),
      deleteByMonitorId: vi.fn().mockResolvedValue(undefined),
    };

    const scheduler = new MonitorSchedulerService(mockConfigService, mockBinancePort, mockSnapshotRepo);

    const result = await scheduler.triggerMonitorNow('m-test');

    expect(result.status).toBe('SUCCESS');
    expect(result.monitorId).toBe('m-test');
    expect(result.records.length).toBe(1);
    expect(mockSnapshotRepo.saveSnapshot).toHaveBeenCalled();
    expect(savedSnapshot).not.toBeNull();
  });
});
