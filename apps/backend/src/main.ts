import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const allowedOrigins = (
    process.env.ADMIN_ALLOWED_ORIGINS ??
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api/v1', { exclude: ['receipts/html/:token'] });
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('uni-pos API')
    .setDescription('Retail-first Universal Commerce Platform backend API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    jsonDocumentUrl: 'docs/json',
  });

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);
  logger.log(`Backend running at http://localhost:${port}/api/v1`);
  logger.log(`Swagger available at http://localhost:${port}/docs`);
}

void bootstrap();
