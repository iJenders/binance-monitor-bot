import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Verificar estado de salud del sistema' })
  @ApiResponse({ status: 200, description: 'Estado de salud recuperado' })
  getHealth() {
    return this.appService.getHealth();
  }
}
