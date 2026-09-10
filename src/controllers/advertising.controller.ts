import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AdvertisingQueryService } from '../services/advertising-query.service.js';

@ApiTags('Advertising')
@Controller('api/v1/advertising')
export class AdvertisingController {
  constructor(private readonly advertisingQueryService: AdvertisingQueryService) {}

  @Get('history')
  @ApiOperation({
    summary: 'Obtener historial de capturas de anuncios P2P',
    description: 'Devuelve un listado de snapshots de anuncios recolectados por el Cron dentro del rango de tiempo indicado (por defecto, las últimas 24 horas).',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Ventana de tiempo en horas a consultar hacia atrás desde "to" o desde la hora actual. Valor por defecto: 24.',
    example: 24,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Fecha y hora de inicio en formato ISO (ej. 2026-09-08T00:00:00.000Z). Si se especifica, invalida el cálculo relativo de "hours".',
    example: '2026-09-08T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Fecha y hora de fin en formato ISO (ej. 2026-09-08T23:59:59.000Z). Por defecto es la hora actual.',
    example: '2026-09-08T23:59:59.000Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de capturas de anuncios obtenido correctamente.',
    schema: {
      example: {
        success: true,
        count: 1,
        periodHours: 24,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            timestamp: '2026-09-08T13:40:00.000Z',
            records: [
              {
                adv: {
                  advNo: '12345678',
                  price: '45.50',
                  asset: 'USDT',
                  fiatUnit: 'VES',
                },
                advertiser: {
                  userNo: '87654321',
                  nickName: 'TraderVES',
                },
              },
            ],
          },
        ],
      },
    },
  })
  async getHistory(
    @Query('hours') hours?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const parsedHours = hours ? parseFloat(hours) : 24;
    const snapshots = await this.advertisingQueryService.getHistory(parsedHours, from, to);

    return {
      success: true,
      count: snapshots.length,
      periodHours: parsedHours,
      data: snapshots,
    };
  }
}
