import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerOrderService } from './server-order.service';
import { ServerOrder } from './entity/server-order.entity';
import { ServerOrderController } from './server-order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServerOrder])],
  providers: [ServerOrderService],
  controllers: [ServerOrderController],
})
export class ServerOrderModule {}
