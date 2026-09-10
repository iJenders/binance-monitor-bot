import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  it('debe responder el estado de salud del sistema', () => {
    const controller = new AppController(new AppService());
    const health = controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.version).toBe('2.0');
  });
});
