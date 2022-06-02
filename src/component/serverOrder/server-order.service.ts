import {
  BadRequestException,
  Injectable,
  // InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, Brackets, getConnection } from 'typeorm';
import { CreateOrderHistoryDto } from '../order-history/dto/create-order-history.dto';
import { OrderHistoryService } from '../order-history/order-history.service';
import { OrdersService } from '../orders/orders.service';
import { StoreService } from '@beerstore/core/component/store/store.service';
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
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BamboraService } from '@beerstore/core/component/bambora/bambora.service';
import { BeerGuyUpdateDto } from './dto/beerguy-order-update.dto';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ServerOrderDeliveryDetails } from './entity/server-order-delivery-details.entity';
import { CustomerTypeEnum, ServerOrderCustomerDetails } from './entity/server-order-customer-details.entity';
import { ServerOrderProductDetails } from './entity/server-order-product-details.entity';
const OrderstatusText = {
  5: 'cancelled',
  10: 'completed',
  8: 'awaiting pickup',
  3: 'partial shipped',
};
@Injectable()
export class ServerOrderService {
  constructor(
    private authService: AuthService,
    private httpService: HttpService,
    private configService: ConfigService,
    private ordersService: OrdersService,
    private bamboraService: BamboraService,
    private storeService: StoreService,
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
      table.andWhere('ServerOrder.orderDate = :searchFromDate', {
        searchFromDate,
      });
    } else {
      table.andWhere(
        'ServerOrder.orderDate BETWEEN :searchFromDate AND :searchToDate',
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

  async completeDetail(orderId: number, storeId: number, tranId: string) {
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
        this.getCustomerProof(orderId),
        this.storeService.getStore(storeId, false, null),
        ...(tranId !== 'na'
          ? [this.bamboraService.getPaymentInfoByTranasctionId(tranId)]
          : []),
      ]);
      return {
        orderDetails: resp[0],
        serverOrder: resp[1] || [],
        orderFeed: resp[2] || [],
        orderHistory: resp[3]?.items || [],
        ctmProof: resp[4] || [],
        deliveryCharges: resp[5]?.deliveryFee?.fee || '11.95',
        ...(tranId !== 'na' && {
          cardDetails: {
            lastFour: resp[6]?.card?.last_four || '',
            cardType: resp[6]?.card?.card_type || '',
            payment: resp[6]?.amount || '',
          },
        }),
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

    let order = await this.serverOrderRepository.findOne({
      where: {
        orderId: serverOrder.orderId
      }
    });

    if (order !== undefined) {
      return "Order Already exist";
    }

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction()
    try {
      const orderDetails = await lastValueFrom(this.httpService
        .get(
          `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
          }/v2/orders/${serverOrder.orderId}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        ).pipe(
          map((response) => response.data),
          catchError((err) => {
            const message = err.message;
            throw new UnprocessableEntityException(message);
          }),
        )
      );

      const productDetailsArr = await lastValueFrom(this.httpService
        .get(orderDetails.products.url,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        ).pipe(
          map((response) => response.data),
          catchError((err) => {
            const message = err.message;
            throw new UnprocessableEntityException(message);
          }),
        )
      );

      const transactionDetails = (serverOrder.transactionId) ? await this.bamboraService.getPaymentInfoByTranasctionId(serverOrder.transactionId): "";

      const billingAddressFormFields = JSON.parse(orderDetails?.billing_address?.form_fields[0]?.value);

      const deliveryDetails = {
        orderId: serverOrder.orderId,
        deliveryId: null,
        deliveryGuyName: null,
        deliveryDate: null,
        deliveryAddress: `${orderDetails.billing_address.street_1}, ${orderDetails.billing_address.street_2} ${orderDetails.billing_address.street_2 ? ',' : ''}${orderDetails.billing_address.city
          }${orderDetails.billing_address.city ? ',' : ''}${orderDetails.billing_address.state
          }${orderDetails.billing_address.state ? ',' : ''}${orderDetails.billing_address.zip
          }`,
        deliveryCity: orderDetails.billing_address.city,
        deliveryPostalCode: orderDetails.billing_address.zip,
        deliveryType: null,
        deliveryETA: null,
        deliveryScheduledDateTime: null,
      };

      const customerDetails = {
        orderId: serverOrder.orderId,
        name: `${orderDetails.billing_address.first_name} ${orderDetails.billing_address.last_name}`,
        email: orderDetails.billing_address.email,
        postalCode: orderDetails.billing_address.zip,
        dob: billingAddressFormFields.dob,
        salutation: billingAddressFormFields.salutation,
        customerType: CustomerTypeEnum.Email,
        ccType: transactionDetails?.card?.card_type || null,
        cardNumber: transactionDetails?.card?.last_four || null,
        cardAmount: transactionDetails?.amount || 0,
      }

      let singleUnits = 0;
      let twoSixUnits = 0;
      let eightEighteenUnits = 0;
      let twentyFourPlusUnits = 0;
      let volumeTotalHL = 0;

      let productsArr = productDetailsArr.map((product, index) => {
        let temp = (product?.product_options[0]?.display_value)?.split(" ");
        let packSize = temp[0] || 0;
        let volume = temp[3] || 0;
        let containerType = temp[2] || "";

        if (packSize == 1) {
          singleUnits += product?.quantity || 0;
        } else if (packSize >= 2 && packSize <= 6) {
          twoSixUnits += product?.quantity || 0;
        } else if (packSize >= 8 && packSize <= 18) {
          eightEighteenUnits += product?.quantity || 0;
        } else if (packSize >= 24) {
          twentyFourPlusUnits += product?.quantity || 0;
        }

        let hlTotal = ((((product.quantity * packSize) * volume) / 1000)/ 100);
        volumeTotalHL += hlTotal;
        return {
          orderId: serverOrder.orderId,
          lineItem: index + 1,
          itemSKU: product.sku,
          itemDescription: "",
          brewer: "",
          category: "",
          quantity: product.quantity,
          packSize,
          volume,
          containerType,
          itemTotal: product.total_inc_tax,
          itemHLTotal: hlTotal,
          available: true,
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          utmTerm: null,
          utmContent: null,
        }
      });
      const timeSplit = serverOrder.fulfillmentTime.split('-') || '';
      const orderDateTimeString = moment
        .utc(serverOrder.orderDateTime)
        .format('YYYY-MM-DD hh:mm:ss');
      let cancellationDate = null;
      if (serverOrder.cancellationDate) {
        cancellationDate = moment
          .utc(serverOrder.cancellationDate)
          .format('YYYY-MM-DD hh:mm:ss');
      }
      const orderDateTime = orderDateTimeString.split(' ');
      const serverOrderParsed = {
        ...serverOrder,
        fulfillmentTime: moment(timeSplit[0]?.trim(), ['h:mm A']).format(
          'HH:mm:ss',
        ),
        orderTime: orderDateTime[1].trim(),
        orderDate: orderDateTime[0].trim(),
        cancellationDate,
        orderVector: billingAddressFormFields.source,
        partialOrder: false,
        productTotal: Number(parseFloat(orderDetails.total_ex_tax).toFixed(2)),
        deliveryFee: Number(parseFloat(orderDetails.shipping_cost_ex_tax).toFixed(2)),
        deliveryFeeHST: Number(parseFloat(orderDetails.shipping_cost_tax).toFixed(2)),
        grandTotal: Number(parseFloat(orderDetails.total_ex_tax).toFixed(2)) + Number(parseFloat(orderDetails.shipping_cost_ex_tax).toFixed(2)) + Number(parseFloat(orderDetails.shipping_cost_tax).toFixed(2)),
        volumeTotalHL,
        singleUnits: singleUnits,
        packUnits2_6: twoSixUnits,
        packUnits8_18: eightEighteenUnits,
        packUnits_24Plus: twentyFourPlusUnits,
        submittedDateTime: moment.utc(orderDetails.date_created).format('YYYY-MM-DD hh:mm:ss'),
        openDateTime: null,
        pickUpReadyDateTime: null,
        completedByEmpId: null,
        completedDateTime: null,
        idChecked: "",
        requestedPickUpTime: null,
        browserVersion: "",
        refunded: false,
        refundedAmount: 0,
        refundReason: "",
        pickUpType: billingAddressFormFields.pickup_type,
      };
      delete serverOrderParsed.orderDateTime;
      delete serverOrderParsed.customerName;
      delete serverOrderParsed.customerEmail;

      await queryRunner.manager.save(ServerOrder, serverOrderParsed);
      await queryRunner.manager.save(ServerOrderProductDetails, productsArr);
      await queryRunner.manager.save(ServerOrderCustomerDetails, customerDetails);
      await queryRunner.manager.save(ServerOrderDeliveryDetails, deliveryDetails);

      await queryRunner.commitTransaction();
      return 'Order placed';
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: number): Promise<ServerOrder> {
    const order = await this.serverOrderRepository.findOne({
      where: { orderId: id },
    });
    return order;
  }

  // async removeServerOrder(id: number) {
  //   const order = await this.serverOrderRepository.findOne(id);
  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }
  //   return this.serverOrderRepository.delete(id);
  // }

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
    partial: string,
  ): Promise<ServerOrder> {
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.serverOrderRepository.update(order.id, {
      orderStatus,
      partial,
    });
    return this.findOne(id);
  }

  /**
   *  updates order (except cancel and complete)
   * @param id
   * @param createOrderHistoryDto
   * @param orderStatus
   * @param createOrderDto
   * @returns
   */
  async updateOrderDetails(
    id: number,
    createOrderHistoryDto: CreateOrderHistoryDto,
    orderStatus: number,
    createOrderDto: CreateOrderDto,
    partial?: string,
    checkoutId?: string,
  ): Promise<ServerOrder> {
    try {
      console.log('checkoutId', checkoutId);
      await this.ordersService.updateOrder(`${id}`, createOrderDto);
      const response = await Promise.all([
        this.updateServerOrderStatus(id, orderStatus, partial),
        this.orderHistoryService.create(createOrderHistoryDto),
      ]);
      await this.sendPushNotification(
        this.configService.get('beerstoreApp').title,
        `Your Order #${id} has been ${OrderstatusText[orderStatus]}.`,
        checkoutId,
        id.toString(),
      );
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async handleBeerGuy(updateOrder: BeerGuyUpdateDto): Promise<ServerOrder> {
    try {
      const serverOrder = {
        orderStatus: +updateOrder.orderId,
        cancellationReason: updateOrder?.cancellationReason || '',
        cancellationBy: updateOrder?.cancellationBy || '',
        cancellationDate: updateOrder.cancellationDate || null,
      };
      const orderHistory = {
        orderId: updateOrder.orderId,
        orderStatus: updateOrder.orderStatus,
        name: updateOrder.driverName || '',
        identifier: 'The Beer Guy',
      };
      const orderDetails = {
        status_id: updateOrder.orderStatus,
      };
      const customerProof = {
        orderId: updateOrder.orderId,
        underInfluence: updateOrder.underInfluence,
        dobBefore: updateOrder.dobBefore,
        photoId: updateOrder.photoId,
        ...(updateOrder?.driverName && { driverName: updateOrder.driverName }),
      };
      if (updateOrder.orderType === 'delivery') {
        //TODO: fetch checkout id from bigcomm

        const response = this.updateOrder(
          updateOrder.orderId,
          orderDetails,
          serverOrder,
          orderHistory,
          customerProof,
          '',
        );
        return response;
      } else {
        throw new BadRequestException('Order type is not delivery');
      }
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async cancelOrder(id: number, data: CancelOrderDto): Promise<ServerOrder> {
    try {
      const {
        orderType,
        transactionId,
        cancellationReason,
        orderStatus,
        cancellationBy,
        cancellationDate,
        cancellationNote,
        checkoutId,
      } = data;
      if (orderType === 'pickup' || orderType === 'curbside') {
        if (transactionId) {
          // await this.bamboraService.UpdatePaymentStatus(transactionId, {
          //   amount: 0,
          // });
        }
      } else if (orderType === 'delivery') {
        await this.cancelBeerGuyOrder(`${id}`, cancellationReason);
      }
      const resp = await this.ordersService.updateOrder(`${id}`, {
        status_id: +orderStatus,
      });
      // console.log('res', resp);
      const response = await Promise.all([
        this.updateServerOrder(id, {
          orderId: `${id}`,
          orderStatus: +orderStatus,
          cancellationBy,
          cancellationDate,
          cancellationReason,
          cancellationNote: cancellationNote || '',
        }),
        this.orderHistoryService.create({
          orderId: `${id}`,
          orderStatus: +orderStatus,
          name: cancellationBy,
          identifier: '',
        }),
      ]);
      await this.sendPushNotification(
        this.configService.get('beerstoreApp').title,
        `Your Order #${id} has been cancelled.`,
        checkoutId,
        id.toString(),
      );
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
    checkoutId: string,
  ): Promise<any> {
    console.log('checkoutId', checkoutId);
    const requests = [];
    try {
      const { amount, ...orderDetails } = serverOrder;
      if (
        serverOrder.orderType === 'pickup' ||
        serverOrder.orderType === 'curbside'
      ) {
        if (serverOrder?.transactionId) {
          await this.bamboraService.UpdatePaymentStatus(
            serverOrder.transactionId,
            {
              amount: Number(parseFloat(amount).toFixed(2)),
            },
          );
        }
      } else if (serverOrder.orderType === 'delivery') {
        // update beer guy
      }

      const resp = await this.ordersService.updateOrder(
        orderId,
        createOrderDto,
      );
      requests.push(this.updateServerOrder(+orderId, orderDetails));
      requests.push(this.orderHistoryService.create(createOrderHistoryDto));
      requests.push(this.addCustomerProof(customerProof));
      const response = await Promise.all(requests);
      console.log('response', response);
      await this.sendPushNotification(
        this.configService.get('beerstoreApp').title,
        `Your Order #${orderId} has been ${
          OrderstatusText[serverOrder.orderStatus]
        }.`,
        checkoutId,
        orderId,
      );
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
  sendPushNotification = async (
    title: string,
    subtitle: string,
    checkoutId: string,
    order_id: string,
  ) => {
    const payload = {
      title,
      subtitle,
      checkoutId,
      order_id,
    };
    const sendpush = await lastValueFrom(
      this.httpService
        .post(
          `${
            this.configService.get('beerstoreApp').url
          }/customer/SendPushNotificaton`,
          payload,
          {
            headers: {
              Authorization:
                'Bearer ' + this.configService.get('beerstoreApp').token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(err.message);
            }

            throw new BadRequestException(err.message);
          }),
        ),
    );
    return sendpush;
  };
  cancelBeerGuyOrder = async (orderId: string, cancelReason: string) => {
    const payload = {
      tbs_purchase_id: orderId,
      cancelReason,
      order_status: 'cancelled',
    };
    const params = new URLSearchParams({
      api_key: this.configService.get('thebeerguy').key,
    });
    const cancelOrderRes = await lastValueFrom(
      this.httpService
        .post<{ result: string; output: string }>(
          `${
            this.configService.get('thebeerguy').url
          }/purchase/cancel/?${params.toString()}`,
          payload,
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            const message = err.message;
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
    console.log('beerguy cancel order', cancelOrderRes);
    return cancelOrderRes;
  };
}