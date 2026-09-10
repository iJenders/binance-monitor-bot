import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AdvertisingRepositoryPort } from '../ports/advertising-repository.port.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';
import { AppSettingsService } from '../services/app-settings.service.js';

@Injectable()
export class FileAdvertisingRepositoryAdapter implements AdvertisingRepositoryPort {
  private readonly logger = new Logger(FileAdvertisingRepositoryAdapter.name);

  constructor(private readonly appSettings: AppSettingsService) {}

  private async resolveFilePath(): Promise<string> {
    const settings = await this.appSettings.get();
    const configured = settings.dataFilePath || 'data/advertising_history.jsonl';
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      this.logger.error(`Error al crear el directorio para el almacenamiento de archivos: ${error}`);
    }
  }

  public async saveSnapshot(snapshot: AdvertisingSnapshot): Promise<void> {
    try {
      const filePath = await this.resolveFilePath();
      await this.ensureDirectoryExists(filePath);
      const line = JSON.stringify(snapshot) + '\n';
      await fs.appendFile(filePath, line, 'utf-8');
      this.logger.log(`Snapshot guardado exitosamente [ID: ${snapshot.id}] con ${snapshot.records?.length || 0} anuncios.`);
    } catch (error) {
      this.logger.error(`Error al guardar el snapshot en archivo: ${error}`);
      throw error;
    }
  }

  public async findByTimeRange(startDate: Date, endDate: Date): Promise<AdvertisingSnapshot[]> {
    try {
      const snapshots = await this.readAllSnapshots();
      return snapshots.filter((parsed) => {
        const snapshotDate = new Date(parsed.timestamp);
        return snapshotDate >= startDate && snapshotDate <= endDate;
      });
    } catch (error) {
      this.logger.error(`Error al consultar el rango de tiempo en archivo: ${error}`);
      throw error;
    }
  }

  public async purgeOlderThan(cutoff: Date): Promise<number> {
    const filePath = await this.resolveFilePath();
    await this.ensureDirectoryExists(filePath);

    const { lines, snapshots } = await this.readRawLines();
    if (lines.length === 0) {
      return 0;
    }

    const kept: string[] = [];
    let removed = 0;

    for (let i = 0; i < lines.length; i++) {
      const parsed = snapshots[i];
      if (!parsed) {
        kept.push(lines[i]);
        continue;
      }
      const snapshotDate = new Date(parsed.timestamp);
      if (Number.isNaN(snapshotDate.getTime()) || snapshotDate >= cutoff) {
        kept.push(lines[i]);
      } else {
        removed += 1;
      }
    }

    if (removed === 0) {
      return 0;
    }

    const nextContent = kept.length > 0 ? `${kept.join('\n')}\n` : '';
    await fs.writeFile(filePath, nextContent, 'utf-8');
    this.logger.log(`Depuración completada: ${removed} snapshots anteriores a ${cutoff.toISOString()} eliminados.`);
    return removed;
  }

  private async readAllSnapshots(): Promise<AdvertisingSnapshot[]> {
    const { snapshots } = await this.readRawLines();
    return snapshots.filter((item): item is AdvertisingSnapshot => item !== null);
  }

  private async readRawLines(): Promise<{ lines: string[]; snapshots: Array<AdvertisingSnapshot | null> }> {
    const filePath = await this.resolveFilePath();
    await this.ensureDirectoryExists(filePath);

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return { lines: [], snapshots: [] };
      }
      throw err;
    }

    const lines = fileContent.split('\n').filter((line) => line.trim().length > 0);
    const snapshots: Array<AdvertisingSnapshot | null> = [];

    for (const line of lines) {
      try {
        snapshots.push(JSON.parse(line) as AdvertisingSnapshot);
      } catch (parseError) {
        this.logger.warn(`Línea inválida ignorada en archivo JSONL: ${parseError}`);
        snapshots.push(null);
      }
    }

    return { lines, snapshots };
  }
}
