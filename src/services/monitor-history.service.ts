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
      minPrice: number;
      avgPrice: number;
      maxPrice: number;
      latestPrice: number;
      offerCount: number;
      latestTimestamp: string | null;
    };
    snapshots: AuditSnapshot[];
  }> {
    const toDate = toStr ? new Date(toStr) : new Date();
    const fromDate = fromStr ? new Date(fromStr) : new Date(toDate.getTime() - hours * 60 * 60 * 1000);

    const snapshots = await this.snapshotRepositoryPort.findByMonitor(monitorId, fromDate, toDate);

    // Calculate metrics
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalPriceSum = 0;
    let totalOffersCount = 0;
    let latestPrice = 0;
    let latestTimestamp: string | null = null;

    if (snapshots.length > 0) {
      // Sort chronologically
      snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const latestSnapshot = snapshots[snapshots.length - 1];
      latestTimestamp = latestSnapshot.timestamp;

      for (const snap of snapshots) {
        for (const record of snap.records || []) {
          const price = parseFloat(record.adv?.price || '0');
          if (!Number.isNaN(price) && price > 0) {
            if (price < minPrice) minPrice = price;
            if (price > maxPrice) maxPrice = price;
            totalPriceSum += price;
            totalOffersCount += 1;
          }
        }
      }

      if (latestSnapshot.records && latestSnapshot.records.length > 0) {
        const p = parseFloat(latestSnapshot.records[0].adv?.price || '0');
        if (!Number.isNaN(p)) {
          latestPrice = p;
        }
      }
    }

    const avgPrice = totalOffersCount > 0 ? totalPriceSum / totalOffersCount : 0;
    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === -Infinity) maxPrice = 0;

    return {
      monitorId,
      periodHours: hours,
      count: snapshots.length,
      metrics: {
        minPrice,
        avgPrice,
        maxPrice,
        latestPrice,
        offerCount: totalOffersCount,
        latestTimestamp,
      },
      snapshots,
    };
  }

  public async deleteSnapshot(monitorId: string, snapshotId: string): Promise<boolean> {
    return this.snapshotRepositoryPort.deleteSnapshot(monitorId, snapshotId);
  }
}
