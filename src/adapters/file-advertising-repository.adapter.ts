import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AdvertisingRepositoryPort } from '../ports/advertising-repository.port.js';
import { AdvertisingSnapshot } from '../domain/advertising-snapshot.domain.js';

@Injectable()
export class FileAdvertisingRepositoryAdapter implements AdvertisingRepositoryPort {
  private readonly logger = new Logger(FileAdvertisingRepositoryAdapter.name);
  private readonly filePath = path.join(process.cwd(), 'data', 'advertising_history.jsonl');

  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      this.logger.error(`Error al crear el directorio para el almacenamiento de archivos: ${error}`);
    }
  }

  public async saveSnapshot(snapshot: AdvertisingSnapshot): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      const line = JSON.stringify(snapshot) + '\n';
      await fs.appendFile(this.filePath, line, 'utf-8');
      this.logger.log(`Snapshot guardado exitosamente [ID: ${snapshot.id}] con ${snapshot.records?.length || 0} anuncios.`);
    } catch (error) {
      this.logger.error(`Error al guardar el snapshot en archivo: ${error}`);
      throw error;
    }
  }

  public async findByTimeRange(startDate: Date, endDate: Date): Promise<AdvertisingSnapshot[]> {
    try {
      await this.ensureDirectoryExists();
      let fileContent: string;
      try {
        fileContent = await fs.readFile(this.filePath, 'utf-8');
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          // El archivo aún no existe
          return [];
        }
        throw err;
      }

      const lines = fileContent.split('\n').filter((line) => line.trim().length > 0);
      const snapshots: AdvertisingSnapshot[] = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as AdvertisingSnapshot;
          const snapshotDate = new Date(parsed.timestamp);

          if (snapshotDate >= startDate && snapshotDate <= endDate) {
            snapshots.push(parsed);
          }
        } catch (parseError) {
          this.logger.warn(`Línea inválida ignorada en archivo JSONL: ${parseError}`);
        }
      }

      return snapshots;
    } catch (error) {
      this.logger.error(`Error al consultar el rango de tiempo en archivo: ${error}`);
      throw error;
    }
  }
}
