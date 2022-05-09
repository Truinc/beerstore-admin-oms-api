import { Module } from '@nestjs/common';
import { StoreModule } from '@beerstore/core/component/store/store.module';
import { HttpModule } from '@nestjs/axios';
import { BeerModule } from '@beerstore/core/component/beer/beer.module';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsService } from './checkouts.service';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [HttpModule, CartModule, BeerModule, StoreModule],
  providers: [CheckoutsService],
  controllers: [CheckoutsController],
})
export class CheckoutsModule {}
