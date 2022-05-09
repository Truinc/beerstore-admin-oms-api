import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { UpdateOrderHistoryDto } from './dto/update-order-history.dto';
import { OrderHistory } from './entities/order-history.entity';

@Injectable()
export class OrderHistoryService {
  constructor(
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
  ) {}

  async create(createOrderHistoryDto: CreateOrderHistoryDto) {
    try {
      const createHistory = await this.orderHistoryRepository.create(
        createOrderHistoryDto,
      );
      const history = await this.orderHistoryRepository.save(createHistory);
      return this.findOne(history.id);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll(
    take: number,
    skip: number,
    sort?: object,
    filter?: { order: string },
  ) {
    const query = {};
    Object.assign(query, { skip, take });
    if (sort) {
      Object.assign(query, { order: sort });
    }
    const where = [];
    if (filter && filter.order) {
      where.push({ orderId: filter.order });
    }

    if (where.length > 0) {
      Object.assign(query, { where });
    }

    const [items, total] = await this.orderHistoryRepository.findAndCount(
      query,
    );
    return {
      total,
      take,
      skip,
      items,
    };
  }

  async findOne(id: number) {
    const history = await this.orderHistoryRepository.findOne(id);
    return history;
  }

  async update(id: number, updateOrderHistoryDto: UpdateOrderHistoryDto) {
    const history = await this.findOne(id);
    if (!history) {
      throw new NotFoundException('Order history not found');
    }
    await this.orderHistoryRepository.update(id, updateOrderHistoryDto);
    return this.findOne(history.id);
  }

  async remove(id: number) {
    const history = await this.findOne(id);
    if (!history) {
      throw new NotFoundException('Order not found');
    }
    return this.orderHistoryRepository.delete(id);
  }
}
