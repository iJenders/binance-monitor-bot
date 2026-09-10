import { Injectable } from '@nestjs/common';
import { AdvertisingRepositoryPort } from '../ports/advertising-repository.port.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';

@Injectable()
export class AdvertisingQueryService {
  constructor(private readonly advertisingRepository: AdvertisingRepositoryPort) {}

  public async getHistory(hours: number = 24, from?: string, to?: string): Promise<AdvertisingSnapshot[]> {
    const endDate = to ? new Date(to) : new Date();
    const startDate = from ? new Date(from) : new Date(endDate.getTime() - hours * 60 * 60 * 1000);

    return this.advertisingRepository.findByTimeRange(startDate, endDate);
  }
}
