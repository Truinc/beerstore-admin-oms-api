import {
  BadRequestException,
  Injectable,
  // InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, Brackets } from 'typeorm';
import { CreateOrderHistoryDto } from '../order-history/dto/create-order-history.dto';
import { OrderHistoryService } from '../order-history/order-history.service';
import { OrdersService } from '../orders/orders.service';
import { CreateCustomerProofDto } from './dto/create-customer-proof.dto';
import { CreateServerOrderDto } from './dto/create-server-order.dto';
import { CreatePaymentDetailsDto } from './dto/create-payment-details.dto';
import { CreatePostFeedDto } from './dto/create-post-feed.dto';
import { UpdateCustomerProofDto } from './dto/update-customer-proof.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CustomerProof } from './entity/customer-proof.entity';
import { PaymentDetails } from './entity/payment-details.entity';
import { PostFeed } from './entity/post-feed.entity';
import { OrderEnum, ServerOrder } from './entity/server-order.entity';
import { CreateOrderDto } from '../orders/dto/createOrder.dto';
import AuthService from '../auth/auth.service';
import * as moment from 'moment';

@Injectable()
export class ServerOrderService {
  constructor(
    private authService: AuthService,
    private ordersService: OrdersService,
    private orderHistoryService: OrderHistoryService,
    @InjectRepository(ServerOrder)
    private serverOrderRepository: Repository<ServerOrder>,
    @InjectRepository(PostFeed)
    private postFeedRepository: Repository<PostFeed>,
    @InjectRepository(CustomerProof)
    private customerProofRepository: Repository<CustomerProof>,
    @InjectRepository(PaymentDetails)
    private paymentDetailsRepository: Repository<PaymentDetails>,
  ) {}

  async findAllServerOrder(
    searchFromDate: string,
    searchToDate: string,
    status: OrderEnum,
    take: number,
    skip: number,
    storeId: string,
    sort?: object,
    search?: string,
    orderType?: string,
  ): Promise<object> {
    const table = this.serverOrderRepository.createQueryBuilder('ServerOrder');
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

    // for testing purpose it is commented out
    // table.andWhere('ServerOrder.storeId = :storeId', {
    //   storeId,
    // });

    if (search) {
      table.andWhere(
        new Brackets((qb) => {
          qb.where('ServerOrder.customerName like :customerName', {
            customerName: `%${search}%`,
          }).orWhere('ServerOrder.orderId like :orderId', {
            orderId: `%${search}%`,
          });
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

  async completeDetail(orderId: number) {
    try {
      const resp = await Promise.all([
        this.ordersService.getOrderDetails(`${orderId}`),
        this.serverOrderRepository.findOne({
          where: { orderId },
        }),
        this.findAllPostFeed(orderId),
        this.orderHistoryService.findAll(1000, 0, null, {
          order: `${orderId}`,
        }),
      ]);
      return {
        orderDetails: resp[0],
        serverOrder: resp[1] || [],
        orderFeed: resp[2] || [],
        orderHistory: resp[3]?.items || [],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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

  async addCustomerProof(customerProof: CreateCustomerProofDto) {
    try {
      let id;
      const { orderId } = customerProof;
      const prevProof = await this.customerProofRepository.findOne({
        where: { orderId },
      });
      if (prevProof) {
        id = prevProof.id;
        await this.updateCustomerProof(+orderId, customerProof);
      } else {
        const createCustomerProof = await this.customerProofRepository.create(
          customerProof,
        );
        const response = await this.customerProofRepository.save(
          createCustomerProof,
        );
        id = response.id;
      }
      return this.customerProofRepository.findOne(id);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getCustomerProof(orderId: number) {
    const customerProof = await this.customerProofRepository.findOne({
      where: { orderId },
    });
    return customerProof;
  }

  async updateCustomerProof(
    orderId: number,
    updatedProof: UpdateCustomerProofDto,
  ) {
    const customerProof = await this.getCustomerProof(orderId);
    if (customerProof) {
      await this.customerProofRepository.update(customerProof.id, updatedProof);
      return this.customerProofRepository.findOne(customerProof.id);
    } else {
      throw new NotFoundException('Customer proof not found');
    }
  }

  async addPaymentDetail(paymentDetail: CreatePaymentDetailsDto) {
    try {
      const createPaymentDetail = await this.paymentDetailsRepository.create(
        paymentDetail,
      );
      const response = await this.paymentDetailsRepository.save(
        createPaymentDetail,
      );
      // console.log('response', response);
      return this.paymentDetailsRepository.findOne(response.id);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getPaymentDetail(orderId: number) {
    const paymentDetail = await this.paymentDetailsRepository.findOne({
      where: { orderId },
    });
    return paymentDetail;
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

  async addServerOrder(serverOrder: CreateServerOrderDto): Promise<string> {
    try {
      const timeSplit = serverOrder.fulfillmentTime.split('-') || '';
      const orderDateTimeString = moment
        .utc(serverOrder.orderDateTime)
        .format('YYYY-MM-DD hh:mm:ss');
      const cancellationDate = moment
        .utc(serverOrder.cancellationDate)
        .format('YYYY-MM-DD hh:mm:ss');
      const orderDateTime = orderDateTimeString.split(' ');
      const serverOrderParsed = {
        ...serverOrder,
        fulfillmentTime: moment(timeSplit[0]?.trim(), ['h:mm A']).format(
          'HH:mm:ss',
        ),
        orderTime: orderDateTime[1].trim(),
        orderDate: orderDateTime[0].trim(),
        cancellationDate,
      };
      delete serverOrderParsed.orderDateTime;
      const createOrder = await this.serverOrderRepository.create(
        serverOrderParsed,
      );
      const order = await this.serverOrderRepository.save(createOrder);
      // return this.findOne(+order.orderId);
      return 'Order placed';
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

  async updateServerOrderStatus(
    id: number,
    orderStatus: number,
  ): Promise<ServerOrder> {
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.serverOrderRepository.update(order.id, {
      orderStatus,
    });
    return this.findOne(id);
  }

  async updateOrderDetails(
    id: number,
    createOrderHistoryDto: CreateOrderHistoryDto,
    orderStatus: number,
    createOrderDto: CreateOrderDto,
  ): Promise<ServerOrder> {
    try {
      await this.ordersService.updateOrder(`${id}`, createOrderDto);
      const response = await Promise.all([
        this.updateServerOrderStatus(id, orderStatus),
        this.orderHistoryService.create(createOrderHistoryDto),
      ]);
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async cancelOrder(
    id: number,
    orderHistory: CreateOrderHistoryDto,
    orderDetails: CreateOrderDto,
    serverOrder: UpdateOrderDto,
  ): Promise<ServerOrder> {
    try {
      const resp = await this.ordersService.updateOrder(`${id}`, orderDetails);
      console.log('res', resp);
      const response = await Promise.all([
        this.updateServerOrder(id, serverOrder),
        this.orderHistoryService.create(orderHistory),
      ]);
      console.log('response', response);
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateOrder(
    orderId: string,
    createOrderDto: CreateOrderDto,
    serverOrder: UpdateOrderDto,
    createOrderHistoryDto: CreateOrderHistoryDto,
    customerProof: CreateCustomerProofDto,
  ): Promise<ServerOrder> {
    const requests = [];
    try {
      const resp = await this.ordersService.updateOrder(
        orderId,
        createOrderDto,
      );
      requests.push(this.updateServerOrder(+orderId, serverOrder));
      requests.push(this.orderHistoryService.create(createOrderHistoryDto));
      requests.push(this.addCustomerProof(customerProof));
      const response = await Promise.all(requests);
      console.log('response', response);
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
