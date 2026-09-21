import { Injectable } from '@nestjs/common';
import { AuditSnapshotRepositoryPort } from '../ports/audit-snapshot-repository.port.js';
import { AuditSnapshot } from '../domain/audit-snapshot.domain.js';
import { MonitorMetrics, MonitorMetricsResult } from '../domain/monitor-metrics.domain.js';

export interface MonitorHistoryResponse {
  monitorId: string;
  periodHours: number;
  count: number;
  metrics: MonitorMetricsResult;
  snapshots: AuditSnapshot[];
}

@Injectable()
export class MonitorHistoryService {
  constructor(private readonly snapshotRepositoryPort: AuditSnapshotRepositoryPort) {}

  public async getHistoryByMonitor(
    monitorId: string,
    hours = 24,
    fromStr?: string,
    toStr?: string,
  ): Promise<MonitorHistoryResponse> {
    const toDate = toStr ? new Date(toStr) : new Date();
    const fromDate = fromStr ? new Date(fromStr) : new Date(toDate.getTime() - hours * 60 * 60 * 1000);

    const snapshots = await this.snapshotRepositoryPort.findByMonitor(monitorId, fromDate, toDate);

    // La lógica de cálculo de métricas está encapsulada en el Dominio
    const metrics = MonitorMetrics.calculate(snapshots);

    return {
      monitorId,
      periodHours: hours,
      count: snapshots.length,
      metrics,
      snapshots,
    };
  }

  public async deleteSnapshot(monitorId: string, snapshotId: string): Promise<boolean> {
    return this.snapshotRepositoryPort.deleteSnapshot(monitorId, snapshotId);
  }
}
