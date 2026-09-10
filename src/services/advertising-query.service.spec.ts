import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvertisingQueryService } from './advertising-query.service.js';
import { AdvertisingRepositoryPort } from '../ports/advertising-repository.port.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';

describe('AdvertisingQueryService', () => {
  let service: AdvertisingQueryService;
  let mockRepository: AdvertisingRepositoryPort;

  beforeEach(() => {
    mockRepository = {
      saveSnapshot: vi.fn(),
      findByTimeRange: vi.fn().mockResolvedValue([]),
    };
    service = new AdvertisingQueryService(mockRepository);
  });

  it('should query history with default 24 hours range', async () => {
    const mockSnapshots: AdvertisingSnapshot[] = [
      {
        id: 'test-1',
        timestamp: new Date().toISOString(),
        records: [],
      },
    ];
    vi.mocked(mockRepository.findByTimeRange).mockResolvedValue(mockSnapshots);

    const result = await service.getHistory(24);

    expect(mockRepository.findByTimeRange).toHaveBeenCalledTimes(1);
    const [startDate, endDate] = vi.mocked(mockRepository.findByTimeRange).mock.calls[0];
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(endDate.getTime() - startDate.getTime()).toBeCloseTo(24 * 60 * 60 * 1000, -3);
    expect(result).toEqual(mockSnapshots);
  });

  it('should calculate dates correctly when "from" and "to" parameters are provided', async () => {
    const fromStr = '2026-09-01T00:00:00.000Z';
    const toStr = '2026-09-02T00:00:00.000Z';

    await service.getHistory(24, fromStr, toStr);

    expect(mockRepository.findByTimeRange).toHaveBeenCalledWith(
      new Date(fromStr),
      new Date(toStr),
    );
  });
});
