import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppSettingsPort } from '../ports/app-settings.port.js';
import { APP_SETTINGS_LIMITS, AppSettings } from '../domain/app-settings.js';
import { VES_PAY_TYPES, VesPayType } from '../domain/ves-pay-types.js';

@Injectable()
export class AppSettingsService {
  private current?: AppSettings;
  private loadPromise?: Promise<void>;

  constructor(
    private readonly configService: ConfigService,
    private readonly appSettingsPort: AppSettingsPort,
  ) {}

  public getCatalog(): VesPayType[] {
    return VES_PAY_TYPES;
  }

  public async get(): Promise<AppSettings> {
    await this.ensureLoaded();
    return { ...this.current!, payTypes: [...this.current!.payTypes] };
  }

  public async update(partial: Partial<AppSettings>): Promise<AppSettings> {
    await this.ensureLoaded();
    const merged = this.normalize({
      ...this.current!,
      ...partial,
      payTypes: partial.payTypes ?? this.current!.payTypes,
    });
    this.current = merged;
    await this.appSettingsPort.save(merged);
    return this.get();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.current) {
      return;
    }
    if (!this.loadPromise) {
      this.loadPromise = this.loadFromStore();
    }
    await this.loadPromise;
  }

  private async loadFromStore(): Promise<void> {
    const defaults = this.defaultsFromEnv();
    const stored = await this.appSettingsPort.load();
    this.current = this.normalize({
      ...defaults,
      ...(stored ?? {}),
      payTypes: stored?.payTypes ?? defaults.payTypes,
    });
  }

  private defaultsFromEnv(): AppSettings {
    return this.normalize({
      cronIntervalMs: Number(this.configService.get('CRON_INTERVAL_MS', 60_000)),
      offersRows: Number(this.configService.get('OFFERS_ROWS', 20)),
      payTypes: this.parsePayTypes(this.configService.get<string>('PAY_TYPES', '')),
      retentionHours: Number(this.configService.get('RETENTION_HOURS', 48)),
      dataFilePath: this.configService.get<string>('DATA_FILE', 'data/advertising_history.jsonl'),
    });
  }

  private parsePayTypes(raw: string | undefined): string[] {
    if (!raw) {
      return [];
    }
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalize(input: AppSettings): AppSettings {
    const cronIntervalMs = this.clampNumber(
      input.cronIntervalMs,
      APP_SETTINGS_LIMITS.cronIntervalMs.min,
      APP_SETTINGS_LIMITS.cronIntervalMs.max,
      'cronIntervalMs',
    );
    const offersRows = this.clampNumber(
      input.offersRows,
      APP_SETTINGS_LIMITS.offersRows.min,
      APP_SETTINGS_LIMITS.offersRows.max,
      'offersRows',
    );
    const retentionHours = this.clampNumber(
      input.retentionHours,
      APP_SETTINGS_LIMITS.retentionHours.min,
      APP_SETTINGS_LIMITS.retentionHours.max,
      'retentionHours',
    );

    const payTypes = Array.isArray(input.payTypes)
      ? [...new Set(input.payTypes.map((item) => String(item).trim()).filter(Boolean))]
      : [];

    const dataFilePath = String(input.dataFilePath ?? '').trim();
    if (!dataFilePath) {
      throw new BadRequestException('dataFilePath no puede estar vacío');
    }

    return {
      cronIntervalMs,
      offersRows,
      payTypes,
      retentionHours,
      dataFilePath,
    };
  }

  private clampNumber(value: number, min: number, max: number, field: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${field} debe ser un número válido`);
    }
    if (parsed < min || parsed > max) {
      throw new BadRequestException(`${field} debe estar entre ${min} y ${max}`);
    }
    return parsed;
  }
}
