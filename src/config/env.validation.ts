import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsString()
  APP_URL: string;

  @IsNumber()
  PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  MONGODB_URL: string;

  @IsString()
  DB_SERVER: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  STORE_HASH: string;

  @IsString()
  AUTH_TOKEN: string;

  @IsString()
  BIGCOM_API_URL: string;

  @IsString()
  STORE_URL: string;

  @IsString()
  STORE_AUTH_TOKEN: string;

  @IsString()
  STORE_AUTH_USERNAME: string;

  @IsString()
  STORE_AUTH_PASSWORD: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
