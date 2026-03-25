import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';

async function run() {
  let app;

  try {
    process.env.NODE_ENV = 'test';
    // eslint-disable-next-line no-console
    console.log('OpenAPI snapshot: bootstrapping app...');

    app = await NestFactory.create(AppModule, { logger: false });
    // eslint-disable-next-line no-console
    console.log('OpenAPI snapshot: app bootstrapped.');

    const swaggerConfig = new DocumentBuilder()
      .setTitle('uni-pos API')
      .setDescription('Retail-first Universal Commerce Platform backend API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

    const outputDir = join(process.cwd(), 'openapi');
    await mkdir(outputDir, { recursive: true });

    const outputPath = join(outputDir, 'openapi.baseline.json');
    await writeFile(outputPath, JSON.stringify(swaggerDocument, null, 2), 'utf8');

    // eslint-disable-next-line no-console
    console.log(`OpenAPI snapshot written: ${outputPath}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to export OpenAPI snapshot:', error);
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

void run();
