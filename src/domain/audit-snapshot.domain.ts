import { P2POffer } from './offer.domain.js';
import { MonitorQueryFilter } from './monitor-cron.domain.js';

export interface AuditTrail {
  requestUrl: string;
  requestPayload: MonitorQueryFilter & { page: number };
  httpStatus: number;
  recordsCount: number;
}

export interface AuditSnapshot {
  id: string;
  monitorId: string;
  monitorName: string;
  timestamp: string;
  executionDurationMs: number;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  auditTrail: AuditTrail;
  records: P2POffer[];
}
