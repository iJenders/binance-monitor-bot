import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonitorQueryFilterDto {
  @ApiPropertyOptional({ example: 'VES', description: 'Moneda fiat a monitorear' })
  fiat?: string;

  @ApiPropertyOptional({ example: 'USDT', description: 'Criptoactivo a monitorear' })
  asset?: string;

  @ApiPropertyOptional({ enum: ['BUY', 'SELL'], example: 'BUY', description: 'Tipo de operación' })
  tradeType?: 'BUY' | 'SELL';

  @ApiPropertyOptional({
    type: [String],
    example: ['Banesco', 'PagoMovil'],
    description: 'Métodos de pago a filtrar',
  })
  payTypes?: string[];

  @ApiPropertyOptional({ example: 20, description: 'Cantidad de resultados a recolectar por ejecución' })
  rows?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Monto de transacción para filtrar ofertas' })
  transAmount?: number | null;

  @ApiPropertyOptional({ enum: ['FIAT', 'ASSET'], example: 'FIAT', description: 'Unidad del monto de transacción' })
  transAmountUnit?: 'FIAT' | 'ASSET' | null;
}

export class CreateMonitorRetentionPolicyDto {
  @ApiPropertyOptional({ example: 48, description: 'Horas de retención de snapshots (máx. 720)' })
  retentionHours?: number;
}

export class CreateMonitorDto {
  @ApiProperty({ example: 'Monitor VES/USDT Principal', description: 'Nombre descriptivo del monitor' })
  name!: string;

  @ApiProperty({ example: 60000, description: 'Intervalo de ejecución del cron en milisegundos (mín. 5000)' })
  cronIntervalMs!: number;

  @ApiPropertyOptional({ description: 'Filtros de búsqueda para la API de Binance P2P' })
  queryFilter?: CreateMonitorQueryFilterDto;

  @ApiPropertyOptional({ description: 'Política de retención de snapshots históricos' })
  retentionPolicy?: CreateMonitorRetentionPolicyDto;

  @ApiPropertyOptional({ example: true, description: 'Si el monitor está activo' })
  enabled?: boolean;
}
