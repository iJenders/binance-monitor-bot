import { Injectable } from '@nestjs/common';
import { AuditSnapshotRepositoryPort } from '../ports/audit-snapshot-repository.port.js';
import { AuditSnapshot } from '../domain/audit-snapshot.domain.js';

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
      currentMinPrice: number;
      currentAvgPrice: number;
      currentMaxPrice: number;
      offerCount: number;
      promotedCount: number;
      latestTimestamp: string | null;
    };
    snapshots: AuditSnapshot[];
  }> {
    const toDate = toStr ? new Date(toStr) : new Date();
    const fromDate = fromStr ? new Date(fromStr) : new Date(toDate.getTime() - hours * 60 * 60 * 1000);

    const snapshots = await this.snapshotRepositoryPort.findByMonitor(monitorId, fromDate, toDate);

    // Historical metrics
    let historicalMinPrice = Infinity;
    let historicalMaxPrice = -Infinity;
    let totalPriceSum = 0;
    
    // Current metrics (latest snapshot)
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
          if (!Number.isNaN(price) && price > 0) {
            if (price < historicalMinPrice) historicalMinPrice = price;
            if (price > historicalMaxPrice) historicalMaxPrice = price;
            totalPriceSum += price;
            totalOffersCount += 1;

            if (isLatest) {
              if (price < currentMinPrice) currentMinPrice = price;
              if (price > currentMaxPrice) currentMaxPrice = price;
              currentTotalPriceSum += price;
              currentOffersCount += 1;
            }
          }
        }
      }
    }

    const historicalAvgPrice = totalOffersCount > 0 ? totalPriceSum / totalOffersCount : 0;
    if (historicalMinPrice === Infinity) historicalMinPrice = 0;
    if (historicalMaxPrice === -Infinity) historicalMaxPrice = 0;

    const currentAvgPrice = currentOffersCount > 0 ? currentTotalPriceSum / currentOffersCount : 0;
    if (currentMinPrice === Infinity) currentMinPrice = 0;
    if (currentMaxPrice === -Infinity) currentMaxPrice = 0;

    return {
      monitorId,
      periodHours: hours,
      count: snapshots.length,
      metrics: {
        historicalMinPrice,
        historicalAvgPrice,
        historicalMaxPrice,
        currentMinPrice,
        currentAvgPrice,
        currentMaxPrice,
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
