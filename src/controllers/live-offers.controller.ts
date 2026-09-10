import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LiveOffersService } from '../services/live-offers.service.js';

@ApiTags('Live Offers (Modulo 2 - Instantaneo)')
@Controller('api/v1/live-offers')
export class LiveOffersController {
  constructor(private readonly liveOffersService: LiveOffersService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener ofertas P2P en el instante actual',
    description: 'Realiza una consulta directa y en tiempo real a Binance P2P sin guardar historial.',
  })
  @ApiQuery({ name: 'fiat', required: false, example: 'VES' })
  @ApiQuery({ name: 'asset', required: false, example: 'USDT' })
  @ApiQuery({ name: 'tradeType', required: false, enum: ['BUY', 'SELL'], example: 'BUY' })
  @ApiQuery({ name: 'payTypes', required: false, description: 'Separados por coma', example: 'Banesco,PagoMovil' })
  @ApiQuery({ name: 'rows', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Ofertas en vivo recuperadas exitosamente.' })
  async getLiveOffers(
    @Query('fiat') fiat?: string,
    @Query('asset') asset?: string,
    @Query('tradeType') tradeType?: 'BUY' | 'SELL',
    @Query('payTypes') payTypesRaw?: string,
    @Query('rows') rowsRaw?: string,
  ) {
    const payTypes = payTypesRaw
      ? payTypesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const rows = rowsRaw ? parseInt(rowsRaw, 10) : 20;

    const data = await this.liveOffersService.getLiveOffers({
      fiat,
      asset,
      tradeType,
      payTypes,
      rows,
    });

    return {
      success: true,
      data,
    };
  }
}
