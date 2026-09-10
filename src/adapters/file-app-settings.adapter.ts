import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AppSettingsPort } from '../ports/app-settings.port.js';
import { AppSettings } from '../domain/app-settings.js';

@Injectable()
export class FileAppSettingsAdapter implements AppSettingsPort {
  private readonly logger = new Logger(FileAppSettingsAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  private resolveFilePath(): string {
    const configured = this.configService.get<string>('SETTINGS_FILE', 'data/app-settings.json');
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }

  public async load(): Promise<Partial<AppSettings> | null> {
    const filePath = this.resolveFilePath();
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        return null;
      }
      this.logger.warn(`No se pudo leer el archivo de configuración: ${err}`);
      return null;
    }
  }

  public async save(settings: AppSettings): Promise<void> {
    const filePath = this.resolveFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');
    this.logger.log(`Configuración persistida en ${filePath}`);
  }
}
