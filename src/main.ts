import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, raw } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Webhooks de gateways precisam do corpo cru para validar assinatura HMAC.
  app.use('/webhooks/mercadopago', raw({ type: '*/*' }));
  app.use('/webhooks/sicoob', raw({ type: '*/*' }));
  app.use(json({ limit: '1mb' }));

  app.enableCors({ origin: true, credentials: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`4pay-api ouvindo em :${port}`, 'Bootstrap');
}

bootstrap();
