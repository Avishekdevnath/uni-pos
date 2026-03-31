import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  app.use(helmet());

  const rawOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.ADMIN_ALLOWED_ORIGINS ||
    'http://localhost:3001,http://localhost:3002'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Electron packaged apps send Origin: null (file:// protocol) — allow it explicitly
  const allowElectron = rawOrigins.includes('null');
  const origins = rawOrigins.filter((o) => o !== 'null');

  app.setGlobalPrefix('api/v1', { exclude: ['receipts/html/:token', 'health'] });
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow Electron packaged app (null origin from file://)
      if (origin === 'null' && allowElectron) return callback(null, true);
      // Allow listed origins
      if (origins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
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

  if (!isProd) {
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
  }

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);

  const appUrl = process.env.BACKEND_URL ?? `http://localhost:${port}`;
  logger.log(`Backend running at ${appUrl}/api/v1`);
  if (!isProd) logger.log(`Swagger available at ${appUrl}/docs`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — shutting down gracefully');
    await app.close();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    logger.log('SIGINT received — shutting down gracefully');
    await app.close();
    process.exit(0);
  });
}

void bootstrap();
