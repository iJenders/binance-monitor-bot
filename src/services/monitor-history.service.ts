import { Injectable } from '@nestjs/common';
import { AuditSnapshotRepositoryPort } from '../ports/audit-snapshot-repository.port.js';
import { AuditSnapshot } from '../domain/audit-snapshot.domain.js';
import { calculatePercentile, calculateStdDev } from '../utils/stats.util.js';

@Injectable()
export class MonitorHistoryService {
  constructor(private readonly snapshotRepositoryPort: AuditSnapshotRepositoryPort) {}

  public async getHistoryByMonitor(
    monitorId: string,
    hours = 24,
    fromStr?: string,
    toStr?: string,
  ): Promise<{
    monitorId: string;
    periodHours: number;
    count: number;
    metrics: {
      historicalMinPrice: number;
      historicalAvgPrice: number;
      historicalMaxPrice: number;
      historicalMedianPrice: number;
      historicalP25Price: number;
      historicalP75Price: number;
      historicalStdDevPrice: number;
      historicalUniqueAdvertisers: number;
      historicalTotalLiquidity: number;
      currentMinPrice: number;
      currentAvgPrice: number;
      currentMaxPrice: number;
      currentMedianPrice: number;
      currentP25Price: number;
      currentP75Price: number;
      currentStdDevPrice: number;
      currentUniqueAdvertisers: number;
      currentTotalLiquidity: number;
      offerCount: number;
      promotedCount: number;
      latestTimestamp: string | null;
    };
    snapshots: AuditSnapshot[];
  }> {
    const toDate = toStr ? new Date(toStr) : new Date();
    const fromDate = fromStr ? new Date(fromStr) : new Date(toDate.getTime() - hours * 60 * 60 * 1000);

    const snapshots = await this.snapshotRepositoryPort.findByMonitor(monitorId, fromDate, toDate);

    // Arrays and sets for calculations
    const historicalPrices: number[] = [];
    const historicalAdvertisers = new Set<string>();
    let historicalTotalLiquidity = 0;

    const currentPrices: number[] = [];
    const currentAdvertisers = new Set<string>();
    let currentTotalLiquidity = 0;

    // Basic metrics
    let historicalMinPrice = Infinity;
    let historicalMaxPrice = -Infinity;
    let totalPriceSum = 0;
    
    let currentMinPrice = Infinity;
    let currentMaxPrice = -Infinity;
    let currentTotalPriceSum = 0;
    let currentOffersCount = 0;

    let totalOffersCount = 0;
    let promotedCount = 0;
    let latestTimestamp: string | null = null;

    if (snapshots.length > 0) {
      // Sort chronologically
      snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const latestSnapshot = snapshots[snapshots.length - 1];
      latestTimestamp = latestSnapshot.timestamp;

      for (const snap of snapshots) {
        const isLatest = snap === latestSnapshot;

        for (const record of snap.records || []) {
          // Detect promoted ads: privilegeType > 0 on the Advertising wrapper
          const isPromoted = typeof record.privilegeType === 'number' && record.privilegeType > 0;
          if (isPromoted) {
            promotedCount += 1;
            continue; // exclude from metric calculations
          }

          const price = parseFloat(record.adv?.price || '0');
          const quantity = parseFloat(record.adv?.tradableQuantity || record.adv?.surplusAmount || '0');
          const advertiserNo = record.advertiser?.userNo || 'unknown';

          if (!Number.isNaN(price) && price > 0) {
            historicalPrices.push(price);
            historicalAdvertisers.add(advertiserNo);
            if (!Number.isNaN(quantity) && quantity > 0) {
                historicalTotalLiquidity += quantity;
            }

            if (price < historicalMinPrice) historicalMinPrice = price;
            if (price > historicalMaxPrice) historicalMaxPrice = price;
            totalPriceSum += price;
            totalOffersCount += 1;

            if (isLatest) {
              currentPrices.push(price);
              currentAdvertisers.add(advertiserNo);
              if (!Number.isNaN(quantity) && quantity > 0) {
                  currentTotalLiquidity += quantity;
              }

              if (price < currentMinPrice) currentMinPrice = price;
              if (price > currentMaxPrice) currentMaxPrice = price;
              currentTotalPriceSum += price;
              currentOffersCount += 1;
            }
          }
        }
      }
    }

    // Prepare arrays for percentiles
    historicalPrices.sort((a, b) => a - b);
    currentPrices.sort((a, b) => a - b);

    const historicalAvgPrice = totalOffersCount > 0 ? totalPriceSum / totalOffersCount : 0;
    if (historicalMinPrice === Infinity) historicalMinPrice = 0;
    if (historicalMaxPrice === -Infinity) historicalMaxPrice = 0;
    
    const historicalMedianPrice = calculatePercentile(historicalPrices, 50);
    const historicalP25Price = calculatePercentile(historicalPrices, 25);
    const historicalP75Price = calculatePercentile(historicalPrices, 75);
    const historicalStdDevPrice = calculateStdDev(historicalPrices, historicalAvgPrice);

    const currentAvgPrice = currentOffersCount > 0 ? currentTotalPriceSum / currentOffersCount : 0;
    if (currentMinPrice === Infinity) currentMinPrice = 0;
    if (currentMaxPrice === -Infinity) currentMaxPrice = 0;
    
    const currentMedianPrice = calculatePercentile(currentPrices, 50);
    const currentP25Price = calculatePercentile(currentPrices, 25);
    const currentP75Price = calculatePercentile(currentPrices, 75);
    const currentStdDevPrice = calculateStdDev(currentPrices, currentAvgPrice);

    return {
      monitorId,
      periodHours: hours,
      count: snapshots.length,
      metrics: {
        historicalMinPrice,
        historicalAvgPrice,
        historicalMaxPrice,
        historicalMedianPrice,
        historicalP25Price,
        historicalP75Price,
        historicalStdDevPrice,
        historicalUniqueAdvertisers: historicalAdvertisers.size,
        historicalTotalLiquidity,
        currentMinPrice,
        currentAvgPrice,
        currentMaxPrice,
        currentMedianPrice,
        currentP25Price,
        currentP75Price,
        currentStdDevPrice,
        currentUniqueAdvertisers: currentAdvertisers.size,
        currentTotalLiquidity,
        offerCount: totalOffersCount,
        promotedCount,
        latestTimestamp,
      },
      snapshots,
    };
  }

  public async deleteSnapshot(monitorId: string, snapshotId: string): Promise<boolean> {
    return this.snapshotRepositoryPort.deleteSnapshot(monitorId, snapshotId);
  }
}
