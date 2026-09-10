import { MonitorCronConfig } from '../domain/monitor-cron.domain.js';

export abstract class MonitorConfigRepositoryPort {
  abstract findAll(): Promise<MonitorCronConfig[]>;
  abstract findById(id: string): Promise<MonitorCronConfig | null>;
  abstract save(config: MonitorCronConfig): Promise<void>;
  abstract delete(id: string): Promise<boolean>;
}
