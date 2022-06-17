import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  // InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
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
import { MetaOrPaymentData, Order, OrderData, ProductsDataEntity } from './dto/order-queue.dto';
import { MailService } from 'src/mail/mail.service';
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
    private mailService: MailService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private bamboraService: BamboraService,
    private storeService: StoreService,
    private orderHistoryService: OrderHistoryService,
    @InjectRepository(ServerOrder)
    private serverOrderRepository: Repository<ServerOrder>,
    @InjectRepository(ServerOrderProductDetails)
    private serverOrderProductDetailsRepository: Repository<ServerOrderProductDetails>,
    @InjectRepository(PostFeed)
    private postFeedRepository: Repository<PostFeed>,
    @InjectRepository(CustomerProof)
    private customerProofRepository: Repository<CustomerProof>,
    @InjectRepository(PaymentDetails)
    private paymentDetailsRepository: Repository<PaymentDetails>,
  ) { }

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
    const table = this.serverOrderRepository.createQueryBuilder('ServerOrder').leftJoinAndSelect('ServerOrder.serverOrderCustomerDetails', 'ServerOrderCustomerDetails');
    if (status) {
      table.where('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status,
      });
    }

    if (orderType) {
      table.andWhere('ServerOrder.orderType = :orderType', { orderType });
    }

    if (searchFromDate === searchToDate) {
      const fromDate = searchFromDate;
      const toDate = `${searchFromDate} 23:59:59`;
      table.andWhere(
        'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
        {
          fromDate,
          toDate,
        },
      );
    } else {
      const toDate = `${searchToDate} 23:59:59`;
      table.andWhere(
        'ServerOrder.orderDate BETWEEN :searchFromDate AND :toDate',
        {
          searchFromDate,
          toDate,
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
          qb.where('serverOrderCustomerDetails.name like :customerName', {
            customerName: `%${search}%`,
          }).orWhere('ServerOrder.orderId like :orderId', {
            orderId: `%${search}%`,
          });
        }),
      );
    }

    if (sort) {
      const validSortKey = [
        'id',
        'orderId',
        'orderDate',
        'fulfillmentDate',
        'cancellationDate',
        'cancellationBy',
        'name',
        'orderType',
      ];
      let sortObjKey;
      const sortKey = Object.keys(sort)[0];
      if (sortKey.includes('name')) {
        sortObjKey = `ServerOrderCustomerDetails.name`
      } else {
        sortObjKey = `ServerOrder.${sortKey}`
      }
      if (validSortKey.includes(sortKey)) {
        const sortObj = {
          [sortObjKey]: sort[sortKey],
        };
        table.orderBy(sortObj as { [key: string]: 'ASC' | 'DESC' });
      } else {
        throw new BadRequestException(`Invalid sort param :- ${sortKey}`);
      }
    }

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

  async getAllServerOrderWithRelationData(
    reportType: number,
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string
  ): Promise<object> {
    if (reportType == 1) {
      return this.generateTransactionReportData(
        status_id,
        store_id,
        min_date_created,
        max_date_created,
        vector,
        brewer
      );
    }

    if (reportType == 2) {
      return this.generateOrderReportData(
        status_id,
        store_id,
        min_date_created,
        max_date_created,
        vector,
        brewer
      );
    }
  }

  private async generateTransactionReportData(
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string
  ): Promise<object> {
    const table = this.serverOrderRepository.createQueryBuilder('ServerOrder').leftJoinAndSelect('ServerOrder.serverOrderCustomerDetails', 'serverOrderCustomerDetails').leftJoinAndSelect('ServerOrder.serverOrderDeliveryDetails', 'serverOrderDeliveryDetails').leftJoinAndSelect('ServerOrder.serverOrderProductDetails', 'serverOrderProductDetails');

    if (brewer) {
      let orderIds = await this.serverOrderProductDetailsRepository.createQueryBuilder('ServerOrderProductDetails')
        .where("ServerOrderProductDetails.brewer = :brewer", { brewer })
        .select('DISTINCT(ServerOrderProductDetails.orderId)', 'id').getRawMany();

      if (orderIds.length > 0) {
        table.where('ServerOrder.orderId IN (:...ids) ', {
          ids: orderIds.map(x => x.id),
        });
      }
    }

    if (status_id) {
      table.andWhere('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status_id,
      });
    }

    if (store_id) {
      table.andWhere('ServerOrder.storeId = :storeId', {
        storeId: store_id,
      });
    }

    if (min_date_created && max_date_created) {
      if (moment(min_date_created).isSame(max_date_created)) {
        const fromDate = min_date_created;
        const toDate = moment(max_date_created).endOf('day').format();
        table.andWhere(
          'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
          {
            fromDate,
            toDate,
          },
        );
      } else {
        table.andWhere(
          'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
          {
            fromDate: min_date_created,
            toDate: max_date_created,
          },
        );
      }
    }

    if (vector) {
      table.andWhere('ServerOrder.orderVector = :orderVector', {
        orderVector: vector,
      });
    }
    return table.getMany();
  }

  private async generateOrderReportData(
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string
  ): Promise<Object> {
    const serverOrderQuery = this.serverOrderRepository.createQueryBuilder('ServerOrder').select('DISTINCT(ServerOrder.orderId)', 'id');

    if (status_id) {
      serverOrderQuery.andWhere('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status_id,
      });
    }

    if (store_id) {
      serverOrderQuery.andWhere('ServerOrder.storeId = :storeId', {
        storeId: store_id,
      });
    }

    if (min_date_created && max_date_created) {
      if (moment(min_date_created).isSame(max_date_created)) {
        const fromDate = min_date_created;
        const toDate = moment(max_date_created).endOf('day').format();
        serverOrderQuery.andWhere(
          'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
          {
            fromDate,
            toDate,
          },
        );
      } else {
        serverOrderQuery.andWhere(
          'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
          {
            fromDate: min_date_created,
            toDate: max_date_created,
          },
        );
      }
    }

    if (vector) {
      serverOrderQuery.andWhere('ServerOrder.orderVector = :orderVector', {
        orderVector: vector,
      });
    }

    const ids = (await serverOrderQuery.getRawMany()).map(x => x.id);

    const query = this.serverOrderProductDetailsRepository.createQueryBuilder("ServerOrderProductDetails")

    if (ids.length > 0) {
      query.where("ServerOrderProductDetails.orderId IN (:...ids)", { ids })
    }

    query.leftJoinAndSelect('ServerOrderProductDetails.serverOrder', 'serverOrderDetails')
      .leftJoinAndSelect('serverOrderDetails.serverOrderCustomerDetails', 'serverOrderCustomer');
    ;

    if (brewer) {
      query.andWhere("ServerOrderProductDetails.brewer = :brewer", { brewer })
    }

    return query.getMany();
  }

  async completeDetail(orderId: number, storeId: number) {
    try {
      const resp = await Promise.all([
        this.ordersService.getOrderDetails(`${orderId}`),
        this.serverOrderRepository.findOne({
          where: { orderId },
          relations: ['serverOrderCustomerDetails']
        }),

        this.findAllPostFeed(orderId),
        this.orderHistoryService.findAll(1000, 0, null, {
          order: `${orderId}`,
        }),
        this.getCustomerProof(orderId),
        this.storeService.getStore(storeId, false, null),
        // ...(tranId !== 'na'
        //   ? [this.bamboraService.getPaymentInfoByTranasctionId(tranId)]
        //   : []),
      ]);
      if (!resp[1].openDateTime) {
        this.serverOrderRepository
          .createQueryBuilder()
          .update(ServerOrder)
          .set({ openDateTime: moment.utc().format() })
          .where({ orderId })
          .execute();
      }
      return {
        orderDetails: resp[0],
        serverOrder: resp[1] || [],
        orderFeed: resp[2] || [],
        orderHistory: resp[3]?.items || [],
        ctmProof: resp[4] || [],
        deliveryCharges: resp[5]?.deliveryFee?.fee || '11.95',
        // ...(tranId !== 'na' && {
        //   cardDetails: {
        //     lastFour: resp[6]?.card?.last_four || '',
        //     cardType: resp[6]?.card?.card_type || '',
        //     payment: resp[6]?.amount || '',
        //   },
        // }),
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

  async getCustomerProof(orderId: number) {
    const customerProof = await this.customerProofRepository.findOne({
      where: { orderId },
    });
    return customerProof;
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


    try {
      const products: ProductsDataEntity[] = serverOrder.productsData;
      const orderDetails: OrderData = serverOrder.orderData;
      const transactionDetails: MetaOrPaymentData = serverOrder.paymentData;

      const billingAddressFormFields = JSON.parse(orderDetails?.billing_address?.form_fields[0]?.value);

      const deliveryDetails = {
        orderId: `${orderDetails.id}`,
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
        orderId: `${orderDetails.id}`,
        customerId: `${orderDetails.customer_id}`,
        name: `${orderDetails.billing_address.first_name} ${orderDetails.billing_address.last_name}`,
        email: orderDetails.billing_address.email,
        postalCode: orderDetails.billing_address.zip,
        dob: moment(billingAddressFormFields.dob, "DD-MM-YYYY").format("YYYY-MM-DD"),
        salutation: billingAddressFormFields.salutation,
        customerType: CustomerTypeEnum.Email,
        ccType: transactionDetails?.card?.card_type || null,
        cardNumber: +transactionDetails?.card?.last_four || null,
        cardAmount: +transactionDetails?.amount || 0,
        authCode: +transactionDetails?.auth_code || null,
      }

      let singleUnits = 0;
      let twoSixUnits = 0;
      let eightEighteenUnits = 0;
      let twentyFourPlusUnits = 0;
      let volumeTotalHL = 0;
      let mailProductsArr = [];

      let productsArr = products.map((product, index) => {
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

        let hlTotal = ((((product.quantity * +packSize) * +volume) / 1000) / 100);
        volumeTotalHL += hlTotal;

        mailProductsArr.push({
          imageUrl: "",
          name: product.name,
          displayValue: product?.product_options[0]?.display_value,
          quantity: +product.quantity,
          productSubTotal: Number.parseFloat(product.total_ex_tax).toFixed(2),
          price: Number.parseFloat(product.price_ex_tax).toFixed(2),
          afterDiscountPrice: 0
        });

        return {
          orderId: `${orderDetails.id}`,
          lineItem: index + 1,
          itemSKU: product.sku,
          itemDescription: "",
          brewer: "",
          category: "",
          quantity: product.quantity,
          packSize: +packSize,
          volume: +volume,
          containerType,
          itemTotal: +product.total_inc_tax,
          itemHLTotal: hlTotal,
          available: true,
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          utmTerm: null,
          utmContent: null,
        }
      });
      const timeSplit = billingAddressFormFields.pick_delivery_time.split('-') || '';
      const orderDeliveryDate = billingAddressFormFields.pick_delivery_date_text;
      const fulfillmentDate = moment(`${orderDeliveryDate} ${timeSplit[0]}`, "YYYY-MM-DD HH:mm A").format("YYYY-MM-DD HH:mm:ss");
      const serverOrderParsed = {
        orderId: `${orderDetails.id}`,
        storeId: `${billingAddressFormFields.store_id}`,
        orderType: billingAddressFormFields.order_type === 'pickup' ? billingAddressFormFields.pickup_type : billingAddressFormFields.order_type,
        orderStatus: orderDetails.status_id,
        fulfillmentDate,
        orderDate: moment.utc(orderDetails.date_created).format('YYYY-MM-DD hh:mm:ss'),
        cancellationDate: null,
        cancellationBy: null,
        cancellationReason: null,
        cancellationNote: null,
        transactionId: serverOrder.transactionId || null,
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
        // requestedPickUpTime: `${orderDeliveryDate} ${orderDeliveryDate}`,
        requestedPickUpTime: fulfillmentDate,
        browserVersion: "",
        refunded: false,
        refundedAmount: 0,
        refundReason: "",
        pickUpType: billingAddressFormFields.pickup_type || '',
      };

      await this.serverOrderRepository.save(this.serverOrderRepository.create({
        ...serverOrderParsed,
        serverOrderCustomerDetails: customerDetails,
        serverOrderDeliveryDetails: deliveryDetails,
        serverOrderProductDetails: productsArr,
      }));

      this.mailService.orderCreated({
        to: customerDetails.email,
        orderDetails: {
          customerName: customerDetails.name,
          orderNumber: serverOrder.orderId,
          orderDate: moment(serverOrderParsed.orderDate).format('MMMM D, YYYY'),
          paymentMethod: orderDetails.payment_method,
          totalCost: serverOrderParsed.grandTotal,
          deliverydate: moment(billingAddressFormFields.pick_delivery_date_text).format('MMMM D, YYYY'),
          deliveryLocation: deliveryDetails.deliveryAddress,
          deliveryEstimatedTime: billingAddressFormFields.pick_delivery_time,
          subTotal: Number.parseFloat(orderDetails.subtotal_ex_tax).toFixed(2),
          deliveryCharge: serverOrderParsed.deliveryFee > 0 ? serverOrderParsed.deliveryFee : 0,
          deliveryHst: serverOrderParsed.deliveryFeeHST > 0 ? serverOrderParsed.deliveryFeeHST : 0,
          grandTotal: serverOrderParsed.grandTotal || 0,
          totalSavings: 0,
          saleSavings: 0
        },
        orderProductDetails: mailProductsArr
      });

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

  // async updateServerOrderStatus(
  //   id: number,
  //   orderStatus: number,
  //   partial: string,
  // ): Promise<ServerOrder> {
  //   const order = await this.findOne(id);
  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }
  //   await this.serverOrderRepository.update(order.id, {
  //     orderStatus,
  //     // partial,
  //   });
  //   return this.findOne(id);
  // }


  async serverOrderDetail(orderId: number): Promise<ServerOrder> {
    const serverOrder = await this.serverOrderRepository.findOne({
      orderId: `${orderId}`
    },
      { relations: ['serverOrderProductDetails', 'serverOrderDeliveryDetails', 'serverOrderCustomerDetails'] },
    );
    return serverOrder;
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
    // serverOrder: UpdateOrderDto,
    partial?: string,
    checkoutId?: string,
  ): Promise<any> {
    try {
      console.log('checkoutId', checkoutId, createOrderHistoryDto,
        orderStatus,
        createOrderDto,
        partial,
        checkoutId);
      const serverOrder = await this.serverOrderDetail(id);
      serverOrder.orderStatus = orderStatus;
      serverOrder.partialOrder = partial !== '0';
      if (+serverOrder.orderStatus === +8) {
        serverOrder.pickUpReadyDateTime = moment().toDate()
      }

      console.log('decrease', serverOrder?.serverOrderProductDetails);

      if (serverOrder?.serverOrderProductDetails) {
        createOrderDto.products.forEach((product, _idx) => {
          const updatedProduct = serverOrder.serverOrderProductDetails.find(prod => product.sku === prod.itemSKU);
          if (updatedProduct?.id) {
            serverOrder.serverOrderProductDetails[_idx].quantity = updatedProduct.quantity;
          }
        })
      }

      await this.ordersService.updateOrder(`${id}`, createOrderDto);
      const orderToSave = await this.serverOrderRepository.preload(serverOrder);
      const response = await Promise.all([
        this.serverOrderRepository.save(orderToSave),
        this.orderHistoryService.create(createOrderHistoryDto),
      ]);
      if (checkoutId) {
        await this.sendPushNotification(
          this.configService.get('beerstoreApp').title,
          `Your Order #${id} has been ${OrderstatusText[orderStatus]}.`,
          checkoutId,
          id.toString(),
        );
      }
      return response[0];
    } catch (err) {
      console.log('err', err.message);
      throw new BadRequestException(err.message);
    }
  }

  // to do refactor code for tables change
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
        identifier,
      } = data;
      if (orderType === 'pickup' || orderType === 'curbside') {
        if (transactionId) {
          const test = await this.bamboraService.UpdatePaymentStatus(
            transactionId,
            {
              amount: 0,
            },
          );
        }
      } else if (orderType === 'delivery') {
        await this.cancelBeerGuyOrder(`${id}`, cancellationReason);
      }
      const resp = await Promise.all([this.ordersService.updateOrder(`${id}`, {
        status_id: +orderStatus,
      }),
      this.serverOrderDetail(id),
      ]);

      if (!resp[1]) {
        throw new BadRequestException('Order not found');
      }
      const serverOrder = resp[1];
      serverOrder.orderStatus = +orderStatus;
      serverOrder.cancellationBy = cancellationBy;
      serverOrder.cancellationDate = cancellationDate;
      serverOrder.cancellationReason = cancellationReason;
      serverOrder.cancellationNote = cancellationNote || '';
      serverOrder.cancelledByCustomer = cancellationBy.toLowerCase() === 'customer';
      const orderToSave = await this.serverOrderRepository.preload(serverOrder);

      const response = await Promise.all([
        this.serverOrderRepository.save(orderToSave),
        this.orderHistoryService.create({
          orderId: `${id}`,
          orderStatus: +orderStatus,
          name: cancellationBy,
          identifier:
            cancellationBy.toLowerCase() === 'customer' ? '' : identifier,
        }),
      ]);
      // console.log('res', resp);
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
    console.log('checkoutId123', checkoutId, createOrderDto);
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
      let prevOrder = await this.serverOrderDetail(+orderId);

      if (prevOrder?.serverOrderProductDetails) {
        createOrderDto.products.forEach((product, _idx) => {
          const updatedProduct = prevOrder.serverOrderProductDetails.find(prod => product.sku === prod.itemSKU);
          if (updatedProduct?.id) {
            prevOrder.serverOrderProductDetails[_idx].quantity = updatedProduct.quantity;
          }
        })
      }

      prevOrder = {
        ...prevOrder,
        orderStatus: serverOrder.orderStatus,
        completedByEmpId: +createOrderHistoryDto.identifier || -1,
        idChecked: customerProof.photoId,
        volumeTotalHL: serverOrder.volumeTotalHL,
        singleUnits: serverOrder.singleUnits,
        packUnits2_6: serverOrder.packUnits2_6,
        packUnits8_18: serverOrder.packUnits8_18,
        packUnits_24Plus: serverOrder.packUnits_24Plus,
        underInfluence: customerProof.underInfluence === 1,
        dobBefore: customerProof.dobBefore === 1,
      }

      if (+serverOrder.orderStatus === 5) {
        //cancelled
        console.log('cancelled', serverOrder.orderStatus);
        prevOrder = {
          ...prevOrder,
          cancellationDate: serverOrder.cancellationDate,
          cancellationBy: serverOrder.cancellationBy,
          cancellationReason: serverOrder.cancellationReason,
          cancellationNote: serverOrder.cancellationNote,

        }
      } else if (+serverOrder.orderStatus === 10) {
        //completed
        console.log('completed', serverOrder.orderStatus);
        prevOrder = {
          ...prevOrder,
          completedDateTime: moment().toDate(),
        }
      } else if (+serverOrder.orderStatus === 8) {
        prevOrder = {
          ...prevOrder,
          pickUpReadyDateTime: moment().toDate(),
        }
      }
      await this.ordersService.updateOrder(
        orderId,
        createOrderDto,
      );
      const orderToSave = await this.serverOrderRepository.preload(prevOrder);
      // requests.push(this.updateServerOrder(+orderId, orderDetails));
      requests.push(this.serverOrderRepository.save(orderToSave));
      requests.push(this.orderHistoryService.create(createOrderHistoryDto));
      const response = await Promise.all(requests);
      console.log('response', response);
      await this.sendPushNotification(
        this.configService.get('beerstoreApp').title,
        `Your Order #${orderId} has been ${OrderstatusText[serverOrder.orderStatus]
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
          `${this.configService.get('beerstoreApp').url
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
          `${this.configService.get('thebeerguy').url
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