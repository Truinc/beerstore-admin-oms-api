import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import configuration from './config/configuration';
import { AppService } from './app.service';
import { CustomersModule } from './component/customers/customers.module';
import { AuthModule } from './component/auth/auth.module';
import { TokenModule } from './component/token/token.module';
import { BeerCategoryModule } from '@beerstore/core/component/beer-category/beer-category.module';
import { BeerModule } from '@beerstore/core/component/beer/beer.module';
import { StoreModule } from '@beerstore/core/component/store/store.module';
import { CartModule } from './component/cart/cart.module';
import { OrdersModule } from './component/orders/orders.module';
import { CheckoutsModule } from './component/checkouts/checkouts.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mssql',
          host: configService.get('database').server,
          port: configService.get('database').port,
          username: configService.get('database').user,
          password: configService.get('database').password,
          database: configService.get('database').name,
          synchronize: true,
          extra: {
            trustServerCertificate: true,
          },
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    CustomersModule,
    TokenModule,
    BeerCategoryModule,
    BeerModule,
    CartModule,
    OrdersModule,
    StoreModule,
    CheckoutsModule,
  ],
  providers: [AppService],
})
export class AppModule {}
