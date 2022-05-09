import { CacheModule, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BeerCategoryService } from './beer-category.service';
import { BeerCategoryController } from './beer-category.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
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
  controllers: [BeerCategoryController],
  providers: [BeerCategoryService],
  exports: [BeerCategoryService],
})
export class BeerCategoryModule {}
