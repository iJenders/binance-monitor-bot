import { Injectable } from '@nestjs/common';
import { BinanceP2pPort } from '../ports/binance-p2p.port.js';
import { P2POffer } from '../domain/offer.domain.js';
import { MonitorQueryFilter } from '../domain/monitor-cron.domain.js';

@Injectable()
export class LiveOffersService {
  constructor(private readonly binanceP2pPort: BinanceP2pPort) {}

  public async getLiveOffers(filter?: Partial<MonitorQueryFilter>): Promise<{
    offers: P2POffer[];
    total: number;
    fetchedAt: string;
    durationMs: number;
    filterApplied: Partial<MonitorQueryFilter>;
  }> {
    const filterApplied: Partial<MonitorQueryFilter> = {
      fiat: filter?.fiat || 'VES',
      asset: filter?.asset || 'USDT',
      tradeType: filter?.tradeType || 'BUY',
      payTypes: filter?.payTypes || [],
      rows: filter?.rows || 20,
      transAmount: filter?.transAmount != null ? Number(filter.transAmount) : null,
      transAmountUnit: filter?.transAmountUnit === 'ASSET' ? 'ASSET' : 'FIAT',
    };

    const result = await this.binanceP2pPort.getBinanceOffers(filterApplied);

    return {
      offers: result.records,
      total: result.records.length,
      fetchedAt: new Date().toISOString(),
      durationMs: result.executionDurationMs,
      filterApplied,
    };
  }
}
