import { AppSettings } from '../domain/app-settings.js';

export abstract class AppSettingsPort {
  abstract load(): Promise<Partial<AppSettings> | null>;
  abstract save(settings: AppSettings): Promise<void>;
}
