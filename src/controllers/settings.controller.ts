import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppSettingsService } from '../services/app-settings.service.js';
import { AppSettings } from '../domain/app-settings.js';

@ApiTags('Settings')
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener configuración del monitor',
    description: 'Devuelve los parámetros actuales de recolección, persistencia y el catálogo de bancos VES.',
  })
  @ApiResponse({ status: 200, description: 'Configuración actual.' })
  async getSettings() {
    const data = await this.appSettingsService.get();
    return {
      success: true,
      data,
      catalog: this.appSettingsService.getCatalog(),
    };
  }

  @Put()
  @ApiOperation({
    summary: 'Actualizar configuración del monitor',
    description:
      'Actualiza filtros de banco, cantidad de ofertas, intervalo del cron, retención del historial y ruta de persistencia. Los cambios aplican en el siguiente ciclo (máximo 1s).',
  })
  @ApiBody({
    schema: {
      example: {
        cronIntervalMs: 60000,
        offersRows: 20,
        payTypes: ['Banesco', 'PagoMovil'],
        retentionHours: 48,
        dataFilePath: 'data/advertising_history.jsonl',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Configuración actualizada.' })
  async updateSettings(@Body() body: Partial<AppSettings>) {
    const data = await this.appSettingsService.update(body);
    return {
      success: true,
      data,
    };
  }
}
