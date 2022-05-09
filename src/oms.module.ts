import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import configuration from './config/configuration';
import { AuthModule } from './component/auth/auth.module';
import { UserModule } from './component/user/user.module';
import { ServerOrderModule } from './component/serverOrder/server-order.module';
import { OrderHistoryModule } from './component/order-history/order-history.module';
import { TokenModule } from './component/token/token.module';
// import { OrdersModule } from 'apps/app/src/component/orders/orders.module';
import { StoreModule } from '@beerstore/core/component/store/store.module';
import { BeerCategoryModule } from '@beerstore/core/component/beer-category/beer-category.module';
import { BeerModule } from '@beerstore/core/component/beer/beer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/oms/.env', '.env'],
      load: [configuration],
      validate,
    }),
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mssql',
          // url: 'localhost\\' + configService.get('database').server,
          // entities: [],
          host: configService.get('database').server,
          port: configService.get('database').port,
          username: configService.get('database').user,
          password: configService.get('database').password,
          database: configService.get('database').name,
          synchronize: true,
          extra: {
            trustServerCertificate: true,
          },
          // options: { localAddress: configService.get('database').server },
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ServerOrderModule,
    OrderHistoryModule,
    TokenModule,
    // OrdersModule,
    StoreModule,
    BeerCategoryModule,
    BeerModule,
  ],
})
export class OmsModule {}
