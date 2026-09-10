import { Injectable } from '@nestjs/common';
import { BinanceOfferQuery, BinanceVesPort } from '../ports/binance-ves.port.js';
import { Advertising } from '../domain/advertising.js';

const BINANCE_PAGE_SIZE = 20;

@Injectable()
export class BinanceAdapter implements BinanceVesPort {
  public async getBinanceOffers(query?: BinanceOfferQuery): Promise<Advertising[]> {
    const totalWanted = Math.max(1, query?.rows ?? 20);
    const payTypes = (query?.payTypes ?? []).map((item) => item.trim()).filter(Boolean);
    const collected: Advertising[] = [];
    let page = 1;

    while (collected.length < totalWanted) {
      const remaining = totalWanted - collected.length;
      const rows = Math.min(BINANCE_PAGE_SIZE, remaining);
      const pageData = await this.fetchPage(page, rows, payTypes);

      if (pageData.length === 0) {
        break;
      }

      collected.push(...pageData);

      if (pageData.length < rows) {
        break;
      }

      page += 1;
    }

    return collected.slice(0, totalWanted);
  }

  private async fetchPage(page: number, rows: number, payTypes: string[]): Promise<Advertising[]> {
    const binanceUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

    const body = {
      fiat: 'VES',
      page,
      rows,
      tradeType: 'BUY',
      asset: 'USDT',
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      filterType: 'tradable',
      periods: [],
      additionalKycVerifyFilter: 0,
      publisherType: 'merchant',
      payTypes,
      classifies: ['mass', 'profession', 'fiat_trade'],
      tradedWith: false,
      followed: false,
    };

    try {
      const res = await fetch(binanceUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (json && json.code === '000000' && Array.isArray(json.data)) {
        return json.data as Advertising[];
      }

      throw new Error('Respuesta de Binance sin datos válidos');
    } catch (e) {
      throw new Error('Error consultando Binance P2P: ' + e);
    }
  }
}
