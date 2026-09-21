import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateMonitorQueryFilterDto,
  CreateMonitorRetentionPolicyDto,
} from './create-monitor.dto.js';

export class UpdateMonitorDto {
  @ApiPropertyOptional({
    example: 'Monitor VES/USDT Actualizado',
    description: 'Nombre descriptivo del monitor',
  })
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Si el monitor está activo',
  })
  enabled?: boolean;

  @ApiPropertyOptional({
    example: 120000,
    description: 'Nuevo intervalo de ejecución en milisegundos',
  })
  cronIntervalMs?: number;

  @ApiPropertyOptional({
    description: 'Filtros de búsqueda actualizados para la API de Binance P2P',
  })
  queryFilter?: Partial<CreateMonitorQueryFilterDto>;

  @ApiPropertyOptional({ description: 'Política de retención actualizada' })
  retentionPolicy?: Partial<CreateMonitorRetentionPolicyDto>;
}
