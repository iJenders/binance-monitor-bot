import { AuditSnapshot } from '../domain/audit-snapshot.domain.js';

export abstract class AuditSnapshotRepositoryPort {
  abstract saveSnapshot(snapshot: AuditSnapshot): Promise<void>;
  abstract findByMonitor(
    monitorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditSnapshot[]>;
  abstract purgeOlderThan(monitorId: string, cutoff: Date): Promise<number>;
  abstract deleteByMonitorId(monitorId: string): Promise<void>;
  abstract deleteSnapshot(
    monitorId: string,
    snapshotId: string,
  ): Promise<boolean>;
}
