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
  @IsNumber()
  PORT: number;

  @IsString()
  JWT_SECRET: string;
  @IsString()
  JWT_ACCESS_EXPIRATION_MINUTES: string;
  @IsString()
  JWT_REFRESH_EXPIRATION_DAYS: string;
  @IsString()
  JWT_FORGET_EXPIRATION_MINUTES: string;

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

  @IsString()
  CUSTOMER_DOB_ATTRID: string;
  @IsString()
  CUSTOMER_SALUTATION_ATTRID: string;
  // @IsString()
  // ADDRESS_ATTRID: string;

  @IsString()
  CACHE_TTL: string;
  @IsString()
  CACHE_MAX: string;

  @IsString()
  DEFAULT_DELIVERY_FEE: string;
  @IsString()
  EXTRA_DELIVERY_FEE: string;
  @IsString()
  EXTRA_DELIVERY_FEE_CART_SIZE: string;
  @IsString()
  EXTRA_DELIVERY_FEE_CART_SIZE2: string;

  @IsString()
  WHAT_NEW_TYPE: string;
  @IsString()
  ON_SALE_TYPE: string;
  @IsString()
  BOTTLES: string;
  @IsString()
  BOTTLES_SINGLE: string;
  @IsString()
  BOTTLES_4_PACK: string;
  @IsString()
  BOTTLES_6_PACK: string;
  @IsString()
  BOTTLES_12_PACK: string;
  @IsString()
  BOTTLES_24_PACK: string;
  @IsString()
  CANS: string;
  @IsString()
  CANS_SINGLE: string;
  @IsString()
  CANS_4_PACK: string;
  @IsString()
  CANS_6_PACK: string;
  @IsString()
  CANS_12_PACK: string;
  @IsString()
  CANS_24_PACK: string;
  @IsString()
  KEGS: string;

  @IsString()
  THE_BEER_GUY_URL: string;
  @IsString()
  THE_BEER_GUY_KEY: string;

  @IsString()
  ENABLED3DSECURE: string;
  @IsString()
  VERSION3DSECURE: string;
  @IsString()
  LANGUAGE: string;
  @IsString()
  COLOR_DEPTH: string;
  @IsString()
  SCREEN_WIDTH: string;
  @IsString()
  SCREEN_HEIGHT: string;
  @IsString()
  TIME_ZONE: string;
  @IsString()
  BAMBORA_URL: string;
  @IsString()
  AUTHTOKEN: string;
  @IsString()
  TERMURL: string;

  @IsString()
  CANADAPOST_API_URL: string;
  @IsString()
  CANADAPOST_V: string;
  @IsString()
  CANADAPOST_API_KEY: string;

  @IsString()
  BEERSTORE_APP_URL: string;
  @IsString()
  BEERSTORE_APP_TOKEN: string;
  @IsString()
  BEERSTORE_APP_PUSH_Title: string;

  @IsString()
  MAIL_FROM_EMAIL_ID: string;
  @IsString()
  MAIL_FROM_NAME: string;
  @IsString()
  MAIL_HOST: string;
  @IsString()
  MAIL_ENCRYPTION: string;
  @IsString()
  MAIL_PORT: string;
  @IsString()
  MAIL_USERNAME: string;
  @IsString()
  MAIL_PASSWORD: string;
  @IsString()
  SITE_BASE_URL: string;
  @IsString()
  MAIL_REDIRECT_LINK: string;

  @IsString()
  FIREBASE_TYPE: string;
  @IsString()
  FIREBASE_PROJECT_ID: string;
  @IsString()
  FIREBASE_PRIVATE_KEY_ID: string;
  @IsString()
  FIREBASE_PRIVATE_KEY: string;
  @IsString()
  FIREBASE_CLIENT_EMAIL: string;
  @IsString()
  FIREBASE_CLIENT_ID: string;
  @IsString()
  FIREBASE_AUTH_URI: string;
  @IsString()
  FIREBASE_TOKEN_URI: string;
  @IsString()
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string;
  @IsString()
  FIREBASE_DB_URL: string;

  @IsString()
  INSTRUMENTATIONKEY: string;

  @IsString()
  AZURE_BLOB_CONTAINER_NAME: string;
  @IsString()
  AZURE_BLOB_ACCOUNT_NAME: string;
  @IsString()
  AZURE_BLOB_STORAGE_KEY: string;
  @IsString()
  AZURE_BLOB_CONNECTION_STRING: string;
  @IsString()
  AZURE_BLOB_URL: string;

  @IsString()
  POS_URL: string;
  @IsString()
  POS_USERNAME: string;
  @IsString()
  POS_PASSWORD: string;
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
