import { Advertising } from '../domain/advertising.js';

export class BinanceOfferQuery {
  rows?: number;
  payTypes?: string[];
}

export abstract class BinanceVesPort {
  abstract getBinanceOffers(query?: BinanceOfferQuery): Promise<Advertising[]>;
}
