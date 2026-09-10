import { describe, it, expect, afterEach, vi } from 'vitest';
import { BinanceAdapter } from './binance-ves.binance-api.js';

describe('BinanceAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should paginate until the requested number of offers is reached', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const page = body.page as number;
      const count = body.rows as number;
      const data = Array.from({ length: count }, (_, i) => ({
        adv: { advNo: `${page}-${i}` },
      }));
      return {
        ok: true,
        text: async () => JSON.stringify({ code: '000000', data }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = new BinanceAdapter();
    const result = await adapter.getBinanceOffers({ rows: 25, payTypes: ['Banesco'] });

    expect(result).toHaveLength(25);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(firstBody.payTypes).toEqual(['Banesco']);
    expect(firstBody.rows).toBe(20);
    expect(secondBody.page).toBe(2);
    expect(secondBody.rows).toBe(5);
  });

  it('should return an empty list when Binance responds with no ads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ code: '000000', data: [] }),
      })),
    );

    const adapter = new BinanceAdapter();
    await expect(adapter.getBinanceOffers({ rows: 20, payTypes: ['Zinli'] })).resolves.toEqual([]);
  });
});
