export class AppSettings {
  cronIntervalMs!: number;
  offersRows!: number;
  payTypes!: string[];
  retentionHours!: number;
  dataFilePath!: string;

  constructor(partial?: Partial<AppSettings>) {
    Object.assign(this, partial);
  }
}

export const APP_SETTINGS_LIMITS = {
  cronIntervalMs: { min: 5_000, max: 3_600_000 },
  offersRows: { min: 1, max: 100 },
  retentionHours: { min: 0, max: 8_760 },
} as const;
