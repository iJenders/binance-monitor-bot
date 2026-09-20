import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AuditSnapshotRepositoryPort } from '../ports/audit-snapshot-repository.port.js';
import { AuditSnapshot } from '../domain/audit-snapshot.domain.js';

@Injectable()
export class FileAuditSnapshotRepositoryAdapter implements AuditSnapshotRepositoryPort {
  private readonly logger = new Logger(FileAuditSnapshotRepositoryAdapter.name);

  private getFilePath(monitorId: string): string {
    const sanitizedId = monitorId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(process.cwd(), 'data', `snapshots_${sanitizedId}.jsonl`);
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  public async saveSnapshot(snapshot: AuditSnapshot): Promise<void> {
    try {
      const filePath = this.getFilePath(snapshot.monitorId);
      await this.ensureDirectory(filePath);
      const line = JSON.stringify(snapshot) + '\n';
      await fs.appendFile(filePath, line, 'utf-8');
      this.logger.log(
        `Audit Snapshot guardado [ID: ${snapshot.id}] Monitor: ${snapshot.monitorId} con ${snapshot.records?.length || 0} anuncios. Status: ${snapshot.status}`,
      );
    } catch (error) {
      this.logger.error(`Error al guardar audit snapshot: ${error}`);
      throw error;
    }
  }

  public async findByMonitor(monitorId: string, startDate?: Date, endDate?: Date): Promise<AuditSnapshot[]> {
    const filePath = this.getFilePath(monitorId);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      const snapshots: AuditSnapshot[] = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as AuditSnapshot;
          const snapshotDate = new Date(parsed.timestamp);

          if (startDate && snapshotDate < startDate) {
            continue;
          }
          if (endDate && snapshotDate > endDate) {
            continue;
          }
          snapshots.push(parsed);
        } catch {
          // Ignorar líneas corruptas
        }
      }
      return snapshots;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      this.logger.error(`Error al consultar snapshots de monitor ${monitorId}: ${err}`);
      return [];
    }
  }

  public async purgeOlderThan(monitorId: string, cutoff: Date): Promise<number> {
    const filePath = this.getFilePath(monitorId);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      const kept: string[] = [];
      let removed = 0;

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as AuditSnapshot;
          const snapshotDate = new Date(parsed.timestamp);
          if (Number.isNaN(snapshotDate.getTime()) || snapshotDate >= cutoff) {
            kept.push(line);
          } else {
            removed += 1;
          }
        } catch {
          kept.push(line);
        }
      }

      if (removed > 0) {
        const nextContent = kept.length > 0 ? kept.join('\n') + '\n' : '';
        await fs.writeFile(filePath, nextContent, 'utf-8');
        this.logger.log(
          `Depuración completada para monitor ${monitorId}: ${removed} snapshots anteriores a ${cutoff.toISOString()} eliminados.`,
        );
      }
      return removed;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return 0;
      }
      this.logger.error(`Error durante depuración de snapshots de monitor ${monitorId}: ${err}`);
      return 0;
    }
  }

  public async deleteByMonitorId(monitorId: string): Promise<void> {
    const filePath = this.getFilePath(monitorId);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignorar si no existe
    }
  }

  public async deleteSnapshot(monitorId: string, snapshotId: string): Promise<boolean> {
    const filePath = this.getFilePath(monitorId);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      let found = false;
      const kept: string[] = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as AuditSnapshot;
          if (parsed.id === snapshotId) {
            found = true;
          } else {
            kept.push(line);
          }
        } catch {
          kept.push(line);
        }
      }

      if (found) {
        const nextContent = kept.length > 0 ? kept.join('\n') + '\n' : '';
        await fs.writeFile(filePath, nextContent, 'utf-8');
        this.logger.log(`Snapshot [ID: ${snapshotId}] eliminado del monitor ${monitorId}.`);
      }

      return found;
    } catch (err: any) {
      if (err.code === 'ENOENT') return false;
      this.logger.error(`Error al eliminar snapshot ${snapshotId}: ${err}`);
      return false;
    }
  }
}
