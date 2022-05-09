import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import ValidationExceptions from '@beerstore/core/exceptions/validation.exceptions';

import { OmsModule } from './oms.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(OmsModule, {
    cors: true,
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationExceptions(errors),
    }),
  );
  const configService = app.get<ConfigService>(ConfigService);
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
