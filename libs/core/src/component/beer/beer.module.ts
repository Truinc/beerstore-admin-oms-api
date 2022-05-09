import { CacheModule, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BeerService } from './beer.service';
import { BeerController } from './beer.controller';
import { BeerCategoryModule } from '../beer-category/beer-category.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BeerCategoryModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const obj = {
          ttl: parseInt(`${configService.get('cacheManager').ttl}`, 10),
          max: parseInt(`${configService.get('cacheManager').max}`, 10),
        };
        return obj;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [BeerController],
  providers: [BeerService],
  exports: [BeerService],
})
export class BeerModule {}
