import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection, ILike } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderEnum, ServerOrder } from './entity/server-order.entity';

@Injectable()
export class ServerOrderService {
  constructor(
    @InjectRepository(ServerOrder)
    private serverOrderRepository: Repository<ServerOrder>,
  ) {}

  async findAllServerOrder(
    take: number,
    skip: number,
    sort?: object,
    filter?: { search?: string; status?: OrderEnum },
  ): Promise<object> {
    const query = {};
    Object.assign(query, { skip, take });
    if (sort) {
      Object.assign(query, { order: sort });
    }

    const where = [];
    if (filter) {
      if (filter.search) {
        where.push({
          customerName: ILike(`%${filter.search}%`),
          ...(filter.status && { orderStatus: filter.status }),
        });
        where.push({
          orderId: ILike(`%${filter.search}%`),
          ...(filter.status && { orderStatus: filter.status }),
        });
      } else if (filter.status) {
        where.push({ orderStatus: filter.status });
      }
    }

    if (where.length > 0) {
      Object.assign(query, { where });
    }

    console.log('query', query);
    const [items, total] = await this.serverOrderRepository.findAndCount(query);
    return {
      total,
      take,
      skip,
      items,
    };
  }

  async addServerOrder(serverOrder: CreateOrderDto): Promise<ServerOrder> {
    try {
      const createOrder = await this.serverOrderRepository.create(serverOrder);
      const order = await this.serverOrderRepository.save(createOrder);
      return this.findOne(+order.orderId);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findOne(id: number): Promise<ServerOrder> {
    const order = await this.serverOrderRepository.findOne({
      where: { orderId: id },
    });
    return order;
  }

  async removeServerOrder(id: number) {
    const order = await this.serverOrderRepository.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.serverOrderRepository.delete(id);
  }

  async updateServerOrder(
    id: number,
    serverOrder: UpdateOrderDto,
  ): Promise<ServerOrder> {
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.serverOrderRepository.update(order.id, serverOrder);
    return this.findOne(id);
  }

  // verification reqd.
  bulkImportServerOrder(serverOrders: ServerOrder[]): Promise<any> {
    console.log('serverOrder', serverOrders);
    return getConnection()
      .createQueryBuilder()
      .insert()
      .into(ServerOrder)
      .values(serverOrders)
      .execute();
  }
}
