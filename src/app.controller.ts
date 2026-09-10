import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Advertising } from './domain/advertising.js';

@ApiTags('Advertising')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener ofertas actuales directamente de Binance P2P (Blackbox)',
    description: 'Consulta en tiempo real las ofertas P2P actuales disponibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Arreglo de anuncios obtenidos en tiempo real.',
  })
  getAdvertisings(): Promise<Advertising[]> {
    return this.appService.getAdvertisings();
  }
}
