import { Injectable } from '@nestjs/common';
import { BinanceAdapter } from './adapters/binance-ves.binance-api.js';
import { Advertising } from './domain/advertising.js';

@Injectable()
export class AppService {
  async getAdvertisings(): Promise<Advertising[]> {
    let binanceAdapter = new BinanceAdapter();

    let listaDeOfertas = await binanceAdapter.getBinanceOffers();
    console.log(listaDeOfertas);

    return listaDeOfertas;
  }
}
