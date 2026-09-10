import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Binance Monitor Bot API',
      version: '2.0',
      timestamp: new Date().toISOString(),
    };
  }
}
