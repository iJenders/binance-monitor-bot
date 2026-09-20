export interface MonitorQueryFilter {
  fiat: string;
  asset: string;
  tradeType: 'BUY' | 'SELL';
  payTypes: string[];
  rows: number;
  transAmount?: number | null;
  transAmountUnit?: 'FIAT' | 'ASSET' | null;
}

export interface MonitorRetentionPolicy {
  retentionHours: number;
}

export interface MonitorCronConfig {
  id: string;
  name: string;
  enabled: boolean;
  cronIntervalMs: number;
  queryFilter: MonitorQueryFilter;
  retentionPolicy: MonitorRetentionPolicy;
  createdAt: string;
  updatedAt: string;
}
