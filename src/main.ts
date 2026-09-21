import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Binance Monitor Bot API')
    .setDescription(
      'API para monitoreo modular de ofertas de Binance P2P. Incluye Módulo 1 (Monitoreo con Crons, Gráficas y Auditoría) y Módulo 2 (Ofertas al Instante en Tiempo Real).',
    )
    .setVersion('2.0')
    .addTag(
      'Live Offers (Modulo 2 - Instantaneo)',
      'Consulta de ofertas P2P en el instante actual sin persistencia',
    )
    .addTag(
      'Monitors (Modulo 1 - Monitoreo & Crons)',
      'Gestión de crons de monitoreo, auditoría de peticiones y métricas',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Servidor ejecutándose en: http://localhost:${port}`);
  console.log(
    `Documentación Swagger disponible en: http://localhost:${port}/api/docs`,
  );
}
await bootstrap();
