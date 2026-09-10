import { Advertising } from './advertising.js';

export class AdvertisingSnapshot {
  id!: string;
  timestamp!: string; // ISO 8601 string
  records!: Advertising[];

  constructor(partial?: Partial<AdvertisingSnapshot>) {
    Object.assign(this, partial);
  }
}
