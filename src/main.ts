import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import ValidationExceptions from '@beerstore/core/exceptions/validation.exceptions';
import { json } from 'body-parser';

import { OmsModule } from './oms.module';
import { HttpExceptionFilter } from 'libs/core/exceptions/http-exception.filter';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(OmsModule, {
    cors: true,
  });

  app.use(json({ limit: '5mb' }));

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationExceptions(errors),
    }),
  );
  const configService = app.get<ConfigService>(ConfigService);
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  const firebaseCreds: any = {
    type: configService.get('firebase').type,
    project_id: configService.get('firebase').project_id,
    private_key_id: configService.get('firebase').private_key_id,
    private_key: configService
      .get('firebase')
      .private_key.replace(/\\n/g, '\n'),
    client_email: configService.get('firebase').client_email,
    client_id: configService.get('firebase').client_id,
    auth_uri: configService.get('firebase').auth_uri,
    token_uri: configService.get('firebase').token_uri,
    auth_provider_x509_cert_url:
      configService.get('firebase').auth_provider_x509_cert_url,
    client_x509_cert_url: configService.get('firebase').client_x509_cert_url,
  };
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCreds),
    databaseURL: configService.get('firebase').databaseUrl,
  });

  const port = configService.get('port');

  const config = new DocumentBuilder()
    .setTitle('TheBeerStore OMS')
    .setDescription('Order Management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}

bootstrap();
