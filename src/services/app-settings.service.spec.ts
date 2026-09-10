import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppSettingsService } from './app-settings.service.js';
import { AppSettingsPort } from '../ports/app-settings.port.js';
import { AppSettings } from '../domain/app-settings.js';

describe('AppSettingsService', () => {
  let service: AppSettingsService;
  let port: AppSettingsPort;
  let stored: AppSettings | null;

  beforeEach(() => {
    stored = null;
    port = {
      load: vi.fn(async () => stored),
      save: vi.fn(async (settings: AppSettings) => {
        stored = settings;
      }),
    };
    const config = {
      get: (key: string, defaultValue?: unknown) => {
        const values: Record<string, string | number> = {
          CRON_INTERVAL_MS: 60000,
          OFFERS_ROWS: 20,
          PAY_TYPES: '',
          RETENTION_HOURS: 48,
          DATA_FILE: 'data/advertising_history.jsonl',
        };
        return values[key] ?? defaultValue;
      },
    } as ConfigService;

    service = new AppSettingsService(config, port);
  });

  it('should load defaults from env when no file exists', async () => {
    const settings = await service.get();
    expect(settings.offersRows).toBe(20);
    expect(settings.payTypes).toEqual([]);
    expect(settings.retentionHours).toBe(48);
  });

  it('should persist payTypes and rows on update', async () => {
    const updated = await service.update({
      offersRows: 40,
      payTypes: ['Banesco', 'PagoMovil'],
    });

    expect(updated.offersRows).toBe(40);
    expect(updated.payTypes).toEqual(['Banesco', 'PagoMovil']);
    expect(port.save).toHaveBeenCalledTimes(1);
  });

  it('should reject out-of-range rows', async () => {
    await expect(service.update({ offersRows: 500 })).rejects.toBeInstanceOf(BadRequestException);
  });
});
