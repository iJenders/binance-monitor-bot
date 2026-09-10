import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';

export abstract class AdvertisingRepositoryPort {
  abstract saveSnapshot(snapshot: AdvertisingSnapshot): Promise<void>;
  abstract findByTimeRange(startDate: Date, endDate: Date): Promise<AdvertisingSnapshot[]>;
}
