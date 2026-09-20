import { Injectable } from '@nestjs/common';
import { BinanceFetchResult, BinanceP2pPort } from '../ports/binance-p2p.port.js';
import { Advertising } from '../domain/advertising.js';
import { MonitorQueryFilter } from '../domain/monitor-cron.domain.js';

const BINANCE_PAGE_SIZE = 20;

@Injectable()
export class BinanceP2pAdapter implements BinanceP2pPort {
  public async getBinanceOffers(queryFilter: Partial<MonitorQueryFilter>): Promise<BinanceFetchResult> {
    const startTime = Date.now();
    const fiat = queryFilter.fiat || 'VES';
    const asset = queryFilter.asset || 'USDT';
    const tradeType = queryFilter.tradeType || 'BUY';
    const totalWanted = Math.max(1, queryFilter.rows ?? 20);
    const payTypes = (queryFilter.payTypes ?? []).map((item) => item.trim()).filter(Boolean);

    const collected: Advertising[] = [];
    let page = 1;
    let lastHttpStatus = 200;
    const binanceUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
    let lastPayloadSent: any = null;

    const MAX_PAGES = 5;
    const isAssetUnit = queryFilter.transAmountUnit === 'ASSET';
    let referencePrice: number | null = null;

    while (collected.length < totalWanted && page <= MAX_PAGES) {
      const body: any = {
        fiat,
        page,
        rows: BINANCE_PAGE_SIZE,
        tradeType,
        asset,
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

      if (queryFilter.transAmount != null && queryFilter.transAmount > 0) {
        if (!isAssetUnit) {
          body.transAmount = String(queryFilter.transAmount);
        } else if (referencePrice != null && referencePrice > 0) {
          body.transAmount = String(Math.round(queryFilter.transAmount * referencePrice));
        }
      }

      lastPayloadSent = body;

      const res = await fetch(binanceUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      lastHttpStatus = res.status;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (json && json.code === '000000' && Array.isArray(json.data)) {
        const pageData = json.data as Advertising[];
        if (pageData.length === 0) {
          break;
        }

        if (referencePrice === null && pageData.length > 0 && pageData[0].adv?.price) {
          referencePrice = parseFloat(pageData[0].adv.price);
        }

        const validPageItems =
          isAssetUnit && queryFilter.transAmount != null && queryFilter.transAmount > 0
            ? pageData.filter((item) => {
                const minQty = item.adv?.minSingleTransQuantity ? parseFloat(item.adv.minSingleTransQuantity) : null;
                const maxQty = item.adv?.dynamicMaxSingleTransQuantity
                  ? parseFloat(item.adv.dynamicMaxSingleTransQuantity)
                  : item.adv?.maxSingleTransQuantity
                  ? parseFloat(item.adv.maxSingleTransQuantity)
                  : item.adv?.surplusAmount
                  ? parseFloat(item.adv.surplusAmount)
                  : null;

                if (minQty !== null && minQty > queryFilter.transAmount!) return false;
                if (maxQty !== null && maxQty < queryFilter.transAmount!) return false;
                return true;
              })
            : pageData;

        collected.push(...validPageItems);

        if (pageData.length < BINANCE_PAGE_SIZE) {
          break;
        }

        page += 1;
      } else {
        throw new Error('Respuesta de Binance sin datos válidos');
      }
    }

    const finalRecords = collected.slice(0, totalWanted);
    const duration = Date.now() - startTime;

    return {
      records: finalRecords,
      executionDurationMs: duration,
      auditTrail: {
        requestUrl: binanceUrl,
        requestPayload: lastPayloadSent || { fiat, asset, tradeType, payTypes, rows: totalWanted, page: 1 },
        httpStatus: lastHttpStatus,
        recordsCount: finalRecords.length,
      },
    };
  }
}
