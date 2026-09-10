import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileAdvertisingRepositoryAdapter } from './file-advertising-repository.adapter.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';

describe('FileAdvertisingRepositoryAdapter', () => {
  let repository: FileAdvertisingRepositoryAdapter;
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'advertising_history.jsonl');

  beforeEach(() => {
    repository = new FileAdvertisingRepositoryAdapter();
  });

  afterEach(async () => {
    try {
      await fs.rm(filePath, { force: true });
    } catch {}
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
});
