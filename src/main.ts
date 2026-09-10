import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Binance Monitor Bot API')
    .setDescription('API para monitoreo de ofertas de Binance P2P, recolección periódica y consulta de historial.')
    .setVersion('1.0')
    .addTag('Advertising', 'Endpoints para consultar ofertas e historial de anuncios P2P')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Servidor ejecutándose en: http://localhost:${port}`);
  console.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}
await bootstrap();
