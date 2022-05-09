import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BeerModule } from '@beerstore/core/component/beer/beer.module';
import { StoreModule } from '@beerstore/core/component/store/store.module';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [HttpModule, ConfigModule, BeerModule,StoreModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
