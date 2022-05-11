import {
  BadRequestException,
  Injectable,
  // InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  getConnection,
  // ILike,
  // Between,
  // Raw,
  getRepository,
  Brackets,
} from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePostFeedDto } from './dto/create-post-feed.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PostFeed } from './entity/post-feed.entity';
import { OrderEnum, ServerOrder } from './entity/server-order.entity';

@Injectable()
export class ServerOrderService {
  constructor(
    @InjectRepository(ServerOrder)
    private serverOrderRepository: Repository<ServerOrder>,
    @InjectRepository(PostFeed)
    private postFeedRepository: Repository<PostFeed>,
  ) {}

  async findAllServerOrder(
    searchFromDate: string,
    searchToDate: string,
    status: OrderEnum,
    take: number,
    skip: number,
    sort?: object,
    search?: string,
    orderType?: string,
  ): Promise<object> {
    const table = getRepository(ServerOrder).createQueryBuilder('ServerOrder');

    if (status) {
      table.where('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status,
      });
    }

    if (orderType) {
      table.andWhere('ServerOrder.orderType = :orderType', { orderType });
    }

    if (searchFromDate === searchToDate) {
      table.andWhere('ServerOrder.fulfillmentDate = :searchFromDate', {
        searchFromDate,
      });
    } else {
      table.andWhere(
        'ServerOrder.fulfillmentDate BETWEEN :searchFromDate AND :searchToDate',
        {
          searchFromDate,
          searchToDate,
        },
      );
    }

    if (search) {
      table.andWhere(
        new Brackets((qb) => {
          qb.where('ServerOrder.customerName like :customerName', {
            customerName: search,
          }).orWhere('ServerOrder.orderId = :orderId', { orderId: search });
        }),
      );
    }

    table.orderBy(sort as { [key: string]: 'ASC' | 'DESC' });
    if (skip) {
      table.skip(skip);
    }
    if (take) {
      table.take(take);
    }

    const [items, total] = await table.getManyAndCount();
    return {
      total,
      take,
      skip,
      items,
    };
  }

  async addPostFeed(postFeed: CreatePostFeedDto) {
    try {
      const createPostFeed = await this.postFeedRepository.create(postFeed);
      const response = await this.postFeedRepository.save(createPostFeed);
      // console.log('response', response);
      return this.postFeedRepository.findOne(response.id);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAllPostFeed(orderId: number) {
    const postFeed = await this.postFeedRepository.find({
      where: { orderId },
    });
    return postFeed;
  }

  async removePostFeed(id: number) {
    const postFeed = await this.postFeedRepository.findOne(id);
    if (!postFeed) {
      throw new NotFoundException('Post Feed not found');
    }
    return this.postFeedRepository.delete(id);
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
    return getConnection()
      .createQueryBuilder()
      .insert()
      .into(ServerOrder)
      .values(serverOrders)
      .execute();
  }
}
