import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MonitorConfigService } from '../services/monitor-config.service.js';
import { MonitorSchedulerService } from '../services/monitor-scheduler.service.js';
import { MonitorHistoryService } from '../services/monitor-history.service.js';

@ApiTags('Monitors (Modulo 1 - Monitoreo & Crons)')
@Controller('api/v1/monitors')
export class MonitorController {
  constructor(
    private readonly monitorConfigService: MonitorConfigService,
    private readonly monitorSchedulerService: MonitorSchedulerService,
    private readonly monitorHistoryService: MonitorHistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las configuraciones de monitores cron' })
  async getAllMonitors() {
    const monitors = await this.monitorConfigService.getAllMonitors();
    return { success: true, count: monitors.length, data: monitors };
  }

  @Get('catalog/pay-types')
  @ApiOperation({ summary: 'Obtener catálogo de métodos de pago soportados' })
  getCatalog() {
    return { success: true, data: this.monitorConfigService.getPayTypesCatalog() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener configuración de un monitor por ID' })
  async getMonitorById(@Param('id') id: string) {
    const monitor = await this.monitorConfigService.getMonitorById(id);
    return { success: true, data: monitor };
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva rutina de monitoreo cron' })
  async createMonitor(@Body() dto: any) {
    const created = await this.monitorConfigService.createMonitor(dto);
    return { success: true, data: created };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar configuración de un monitor cron' })
  async updateMonitor(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.monitorConfigService.updateMonitor(id, dto);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un monitor cron' })
  async deleteMonitor(@Param('id') id: string) {
    await this.monitorConfigService.deleteMonitor(id);
    return { success: true, message: 'Monitor eliminado correctamente.' };
  }

  @Post(':id/collect')
  @ApiOperation({ summary: 'Forzar recolección inmediata de un snapshot para este monitor' })
  async collectNow(@Param('id') id: string) {
    const snapshot = await this.monitorSchedulerService.triggerMonitorNow(id);
    return { success: true, data: snapshot };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtener historial de snapshots y métricas auditadas del monitor' })
  @ApiQuery({ name: 'hours', required: false, type: Number, example: 24 })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getMonitorHistory(
    @Param('id') id: string,
    @Query('hours') hoursRaw?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const hours = hoursRaw ? parseFloat(hoursRaw) : 24;
    const history = await this.monitorHistoryService.getHistoryByMonitor(id, hours, from, to);
    return { success: true, data: history };
  }

  @Delete(':monitorId/snapshots/:snapshotId')
  @ApiOperation({ summary: 'Eliminar un snapshot individual del historial de un monitor' })
  async deleteSnapshot(
    @Param('monitorId') monitorId: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    const deleted = await this.monitorHistoryService.deleteSnapshot(monitorId, snapshotId);
    if (!deleted) {
      throw new NotFoundException(`Snapshot '${snapshotId}' no encontrado en el monitor '${monitorId}'.`);
    }
    return { success: true, deleted: true };
  }
}
