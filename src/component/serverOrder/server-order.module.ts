import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerOrderService } from './server-order.service';
import { ServerOrder } from './entity/server-order.entity';
import { ServerOrderController } from './server-order.controller';
import { PostFeed } from './entity/post-feed.entity';
import { PaymentDetails } from './entity/payment-details.entity';
import { CustomerProof } from './entity/customer-proof.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServerOrder,
      PostFeed,
      PaymentDetails,
      CustomerProof,
    ]),
  ],
  providers: [ServerOrderService],
  controllers: [ServerOrderController],
})
export class ServerOrderModule {}
