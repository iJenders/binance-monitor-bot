import { P2POffer } from '../domain/offer.domain.js';
import { AuditTrail } from '../domain/audit-snapshot.domain.js';
import { MonitorQueryFilter } from '../domain/monitor-cron.domain.js';

export interface BinanceFetchResult {
  records: P2POffer[];
  auditTrail: AuditTrail;
  executionDurationMs: number;
}

export abstract class BinanceP2pPort {
  abstract getBinanceOffers(queryFilter: Partial<MonitorQueryFilter>): Promise<BinanceFetchResult>;
}
