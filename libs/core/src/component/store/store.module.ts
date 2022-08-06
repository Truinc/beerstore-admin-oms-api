import { CacheModule, Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoreHours } from './entities/storeHours.entity';
import { StoreFeatures } from './entities/storeFeatures.entity';
import { HttpModule } from '@nestjs/axios';
import { StoreDeliveryCharges } from './entities/storeDeliveryFee.entity';
import { StoreExtraFeatures } from './entities/storeExtraFeatures.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StoreFavorite } from './entities/storeFavorite.entity';
import { HolidayHours } from './entities/holidayHrs.entity';
import { HolidayInfo } from './entities/holidayInfo.entity';
import { StoreStatus } from './entities/storeStatus.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      StoreHours,
      StoreFeatures,
      StoreDeliveryCharges,
      StoreExtraFeatures,
      StoreFavorite,
      HolidayHours,
      HolidayInfo,
      StoreStatus
    ]),
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const obj = {
          // ttl: parseInt(`${configService.get('cacheManager').ttl}`, 10),
          // max: parseInt(`${configService.get('cacheManager').max}`, 10),
        };
        return obj;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}
