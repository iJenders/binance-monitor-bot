import { Injectable } from '@nestjs/common';
import {
  BinanceFetchResult,
  BinanceP2pPort,
} from '../ports/binance-p2p.port.js';
import { MonitorQueryFilter } from '../domain/monitor-cron.domain.js';
import {
  P2POffer,
  OfferAdvertiser,
  PaymentMethod,
} from '../domain/offer.domain.js';
import {
  BinanceAdvertisingDto,
  BinanceAdvDto,
  BinanceAdvertiserDto,
} from './dtos/binance-api.dto.js';

const BINANCE_PAGE_SIZE = 20;

/**
 * Mapea un anunciante de Binance al modelo de dominio puro OfferAdvertiser.
 */
function mapAdvertiser(dto?: BinanceAdvertiserDto | null): OfferAdvertiser {
  return {
    userNo: dto?.userNo ?? '',
    nickName: dto?.nickName ?? '',
    totalOrders: dto?.orderCount ?? 0,
    monthlyCompletionRate: dto?.monthFinishRate ?? 0,
    positiveRate: dto?.positiveRate ?? 0,
    isProMerchant: dto?.proMerchant ?? false,
  };
}

/**
 * Mapea un anuncio de Binance al modelo de dominio puro P2POffer.
 */
function mapOffer(dto: BinanceAdvertisingDto): P2POffer {
  const adv: BinanceAdvDto = dto.adv ?? {};
  const isPromoted =
    typeof dto.privilegeType === 'number' && dto.privilegeType > 0;

  const paymentMethods: PaymentMethod[] = (adv.tradeMethods ?? []).map(
    (tm) => ({
      id: tm.payType ?? tm.identifier ?? '',
      name: tm.tradeMethodName ?? tm.tradeMethodShortName ?? tm.payType ?? '',
    }),
  );

  const price = parseFloat(adv.price ?? '0') || 0;
  const minTransAmount = parseFloat(adv.minSingleTransAmount ?? '0') || 0;
  const maxTransAmount =
    parseFloat(
      adv.dynamicMaxSingleTransAmount ?? adv.maxSingleTransAmount ?? '0',
    ) || 0;
  const availableAmount =
    parseFloat(adv.surplusAmount ?? adv.tradableQuantity ?? '0') || 0;

  const updatedAt = adv.advUpdateTime
    ? typeof adv.advUpdateTime === 'number'
      ? new Date(adv.advUpdateTime).toISOString()
      : String(adv.advUpdateTime)
    : null;

  return {
    advNo: adv.advNo ?? '',
    price,
    minTransAmount,
    maxTransAmount,
    availableAmount,
    asset: adv.asset ?? '',
    fiat: adv.fiatUnit ?? '',
    tradeType: adv.tradeType === 'SELL' ? 'SELL' : 'BUY',
    paymentMethods,
    advertiser: mapAdvertiser(dto.advertiser),
    isPromoted,
    updatedAt,
  };
}

@Injectable()
export class BinanceP2pAdapter implements BinanceP2pPort {
  public async getBinanceOffers(
    queryFilter: Partial<MonitorQueryFilter>,
  ): Promise<BinanceFetchResult> {
    const startTime = Date.now();
    const fiat = queryFilter.fiat || 'VES';
    const asset = queryFilter.asset || 'USDT';
    const tradeType = queryFilter.tradeType || 'BUY';
    const totalWanted = Math.max(1, queryFilter.rows ?? 20);
    const payTypes = (queryFilter.payTypes ?? [])
      .map((item) => item.trim())
      .filter(Boolean);

    const collected: P2POffer[] = [];
    let page = 1;
    let lastHttpStatus = 200;
    const binanceUrl =
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
    let lastPayloadSent: Record<string, unknown> | null = null;

    const MAX_PAGES = 5;
    const isAssetUnit = queryFilter.transAmountUnit === 'ASSET';
    let referencePrice: number | null = null;

    while (collected.length < totalWanted && page <= MAX_PAGES) {
      const body: Record<string, unknown> = {
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
          body.transAmount = String(
            Math.round(queryFilter.transAmount * referencePrice),
          );
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
      const json = JSON.parse(raw) as {
        code: string;
        data: BinanceAdvertisingDto[];
      } | null;

      if (json && json.code === '000000' && Array.isArray(json.data)) {
        const pageData = json.data;
        if (pageData.length === 0) {
          break;
        }

        // Capturar precio de referencia para conversiones de unidad ASSET
        if (referencePrice === null && pageData[0]?.adv?.price) {
          referencePrice = parseFloat(pageData[0].adv.price);
        }

        // Filtrar por cantidad de activo si aplica, antes de mapear al dominio
        const validPageItems =
          isAssetUnit &&
          queryFilter.transAmount != null &&
          queryFilter.transAmount > 0
            ? pageData.filter((item) => {
                const adv = item.adv ?? {};
                const minQty = adv.minSingleTransQuantity
                  ? parseFloat(adv.minSingleTransQuantity)
                  : null;
                const maxQty = adv.dynamicMaxSingleTransQuantity
                  ? parseFloat(adv.dynamicMaxSingleTransQuantity)
                  : adv.maxSingleTransQuantity
                    ? parseFloat(adv.maxSingleTransQuantity)
                    : adv.surplusAmount
                      ? parseFloat(adv.surplusAmount)
                      : null;

                if (minQty !== null && minQty > queryFilter.transAmount!)
                  return false;
                if (maxQty !== null && maxQty < queryFilter.transAmount!)
                  return false;
                return true;
              })
            : pageData;

        // Mapear DTOs de Binance → Entidades de Dominio
        collected.push(...validPageItems.map(mapOffer));

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
        requestPayload: (lastPayloadSent ?? {
          fiat,
          asset,
          tradeType,
          payTypes,
          rows: totalWanted,
          page: 1,
        }) as unknown as MonitorQueryFilter & { page: number },
        httpStatus: lastHttpStatus,
        recordsCount: finalRecords.length,
      },
    };
  }
}
