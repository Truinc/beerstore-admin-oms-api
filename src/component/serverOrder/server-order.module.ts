import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerOrderService } from './server-order.service';
import { ServerOrder } from './entity/server-order.entity';
import { ServerOrderController } from './server-order.controller';
import { PostFeed } from './entity/post-feed.entity';
import { PaymentDetails } from './entity/payment-details.entity';
import { CustomerProof } from './entity/customer-proof.entity';
import { OrdersModule } from '../orders/orders.module';
import { OrderHistoryModule } from '../order-history/order-history.module';
import { AuthModule } from '../auth/auth.module';
import { BamboraModule } from '@beerstore/core/component/bambora/bambora.module';
import { StoreModule } from '@beerstore/core/component/store/store.module';
import { ServerOrderCustomerDetails } from './entity/server-order-customer-details.entity';
import { ServerOrderDeliveryDetails } from './entity/server-order-delivery-details.entity';
import { ServerOrderProductDetails } from './entity/server-order-product-details.entity';

@Module({
  imports: [
    AuthModule,
    HttpModule,
    forwardRef(() => OrdersModule),
    OrderHistoryModule,
    BamboraModule,
    StoreModule,
    TypeOrmModule.forFeature([
      ServerOrder,
      PostFeed,
      PaymentDetails,
      CustomerProof,
      ServerOrderCustomerDetails,
      ServerOrderDeliveryDetails,
      ServerOrderProductDetails
    ]),
  ],
  providers: [ServerOrderService],
  controllers: [ServerOrderController],
  exports: [ServerOrderService]
})
export class ServerOrderModule {}
