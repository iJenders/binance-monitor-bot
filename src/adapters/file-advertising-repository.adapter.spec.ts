import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { FileAdvertisingRepositoryAdapter } from './file-advertising-repository.adapter.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';
import { AppSettingsService } from '../services/app-settings.service.js';
import { AppSettings } from '../domain/app-settings.js';

describe('FileAdvertisingRepositoryAdapter', () => {
  let repository: FileAdvertisingRepositoryAdapter;
  let filePath: string;
  let dataDir: string;

  const settings = (dataFilePath: string): AppSettingsService =>
    ({
      get: async (): Promise<AppSettings> =>
        ({
          cronIntervalMs: 60_000,
          offersRows: 20,
          payTypes: [],
          retentionHours: 48,
          dataFilePath,
        }) as AppSettings,
    }) as AppSettingsService;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'advertising-repo-'));
    filePath = path.join(dataDir, 'advertising_history.jsonl');
    repository = new FileAdvertisingRepositoryAdapter(settings(filePath));
  });

  afterEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it('should save snapshot and retrieve it within time range', async () => {
    const now = new Date();
    const snapshot: AdvertisingSnapshot = {
      id: 'snap-123',
      timestamp: now.toISOString(),
      records: [{ adv: { price: '45.50' } }],
    };

    await repository.saveSnapshot(snapshot);

    const fromDate = new Date(now.getTime() - 1000 * 60);
    const toDate = new Date(now.getTime() + 1000 * 60);

    const results = await repository.findByTimeRange(fromDate, toDate);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('snap-123');
    expect(results[0].records[0]?.adv?.price).toBe('45.50');
  });

  it('should return empty array if no records fall in date range', async () => {
    const snapshot: AdvertisingSnapshot = {
      id: 'snap-old',
      timestamp: '2020-01-01T00:00:00.000Z',
      records: [],
    };

    await repository.saveSnapshot(snapshot);

    const results = await repository.findByTimeRange(new Date('2026-01-01'), new Date('2026-01-02'));
    expect(results).toHaveLength(0);
  });

  it('should purge snapshots older than the cutoff', async () => {
    await repository.saveSnapshot({
      id: 'old',
      timestamp: '2020-01-01T00:00:00.000Z',
      records: [],
    });
    await repository.saveSnapshot({
      id: 'new',
      timestamp: '2026-09-10T00:00:00.000Z',
      records: [],
    });

    const removed = await repository.purgeOlderThan(new Date('2026-01-01T00:00:00.000Z'));
    expect(removed).toBe(1);

    const remaining = await repository.findByTimeRange(new Date('2010-01-01'), new Date('2030-01-01'));
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('new');
  });
});
