import { Injectable } from '@nestjs/common';
import { Advertising } from './domain/advertising.js';
import { BinanceVesPort } from './ports/binance-ves.port.js';
import { AppSettingsService } from './services/app-settings.service.js';

@Injectable()
export class AppService {
  constructor(
    private readonly binanceVesPort: BinanceVesPort,
    private readonly appSettings: AppSettingsService,
  ) {}

  async getAdvertisings(): Promise<Advertising[]> {
    const settings = await this.appSettings.get();
    return this.binanceVesPort.getBinanceOffers({
      rows: settings.offersRows,
      payTypes: settings.payTypes,
    });
  }
}
