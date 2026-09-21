import { describe, expect, it, vi } from 'vitest';
import { LiveOffersService } from './live-offers.service.js';
import { BinanceP2pPort } from '../ports/binance-p2p.port.js';

describe('LiveOffersService', () => {
  it('debe obtener ofertas en vivo con filtros aplicados', async () => {
    const mockBinancePort: BinanceP2pPort = {
      getBinanceOffers: vi.fn().mockResolvedValue({
        records: [
          {
            adv: { advNo: '1', price: '45.5', asset: 'USDT', fiatUnit: 'VES' },
            advertiser: { userNo: '100', nickName: 'TestUser' },
          },
        ],
        executionDurationMs: 150,
        auditTrail: {
          requestUrl:
            'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
          requestPayload: {
            fiat: 'VES',
            asset: 'USDT',
            tradeType: 'BUY',
            payTypes: ['Banesco'],
            rows: 20,
            page: 1,
          },
          httpStatus: 200,
          recordsCount: 1,
        },
      }),
    };

    const service = new LiveOffersService(mockBinancePort);
    const result = await service.getLiveOffers({
      fiat: 'VES',
      payTypes: ['Banesco'],
    });

    expect(result.offers.length).toBe(1);
    expect(result.durationMs).toBe(150);
    expect(result.filterApplied.fiat).toBe('VES');
    expect(mockBinancePort.getBinanceOffers).toHaveBeenCalledWith(
      expect.objectContaining({
        fiat: 'VES',
        payTypes: ['Banesco'],
      }),
    );
  });
});
