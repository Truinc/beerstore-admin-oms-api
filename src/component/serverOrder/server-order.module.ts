import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerOrderService } from './server-order.service';
import { ServerOrder } from './entity/server-order.entity';
import { ServerOrderController } from './server-order.controller';
import { PostFeed } from './entity/post-feed.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServerOrder, PostFeed])],
  providers: [ServerOrderService],
  controllers: [ServerOrderController],
})
export class ServerOrderModule {}
