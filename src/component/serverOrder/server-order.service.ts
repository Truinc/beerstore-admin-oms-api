/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable prefer-const */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  // InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as momentTz from 'moment-timezone';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Between } from 'typeorm';
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
import {
  CustomerTypeEnum,
  ServerOrderCustomerDetails,
} from './entity/server-order-customer-details.entity';
import { ServerOrderProductDetails } from './entity/server-order-product-details.entity';
import { RefundOrderDto } from '../orders/dto/refundOrder.dto';
import {
  MetaOrPaymentData,
  Order,
  OrderData,
  ProductsDataEntity,
} from './dto/order-queue.dto';
import { MailService } from 'src/mail/mail.service';
import { BeerService } from '@beerstore/core/component/beer/beer.service';
const OrderstatusText = {
  5: 'cancelled',
  10: 'completed',
  8: 'awaiting pickup',
  3: 'partial shipped',
  9: 'awaiting shipment'
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
    private beerService: BeerService,
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
    vector?: string,
  ): Promise<object> {

    const table = this.serverOrderRepository
      .createQueryBuilder('ServerOrder')
      .leftJoinAndSelect(
        'ServerOrder.serverOrderCustomerDetails',
        'ServerOrderCustomerDetails',
      );
    if (status[2]) {
      table.where({
        orderStatus: Between('8', '9'),
      });
    } else {
      table.where('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status,
      });
    }

    if (orderType) {
      table.andWhere('ServerOrder.orderType = :orderType', { orderType });
    }

    if (vector) {
      table.andWhere('ServerOrder.orderVector = :orderVector', {
        orderType: vector,
      });
    }

    // this.orderStatusDate(+orderStatus),

    // if (searchFromDate === searchToDate) {
    //   const fromDate = searchFromDate;
    //   console.log('searchFromDate', searchFromDate);
    //   const toDate = `${searchFromDate} 23:59:59`;
    //   table.andWhere('ServerOrder.orderDate BETWEEN :fromDate AND :toDate', {
    //     fromDate,
    //     toDate,
    //   });
    // } else {
    //   const toDate = `${searchToDate} 23:59:59`;
    //   table.andWhere(
    //     'ServerOrder.orderDate BETWEEN :searchFromDate AND :toDate',
    //     {
    //       searchFromDate,
    //       toDate,
    //     },
    //   );
    // }

    const orderStatus = status[2] ? '8' : status;
    table.andWhere(this.orderStatusDate(+orderStatus), {
      fromDate: searchFromDate,
      toDate:
        searchFromDate === searchToDate
          ? `${searchFromDate} 23:59:59`
          : `${searchToDate} 23:59:59`,
    });

    if (storeId) {
      table.andWhere('ServerOrder.storeId = :storeId', {
        storeId,
      });
    }

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
        sortObjKey = `ServerOrderCustomerDetails.name`;
      } else {
        sortObjKey = `ServerOrder.${sortKey}`;
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
    const parsedItems = items.map((item) => {
      return {
        ...item,
        orderDate: momentTz(item.orderDate).tz(
          this.configService.get('timezone').zone,
        ).format("YYYY/MM/DD - HH:mm"),
      };
    });
    return {
      total,
      take,
      skip,
      items: parsedItems,
    };
  }

  async getAllServerOrderWithRelationData(
    reportType: number,
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string,
    cancelledby: string,
  ): Promise<object> {
    if (reportType == 1) {
      return this.generateTransactionReportData(
        status_id,
        store_id,
        min_date_created,
        max_date_created,
        vector,
        brewer,
        cancelledby,
      );
    }

    if (reportType == 2) {
      return this.generateOrderReportData(
        status_id,
        store_id,
        min_date_created,
        max_date_created,
        vector,
        brewer,
        cancelledby,
      );
    }
  }

  private async generateTransactionReportData(
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string,
    cancelledby: string,
  ): Promise<object> {
    const table = this.serverOrderRepository
      .createQueryBuilder('ServerOrder')
      .leftJoinAndSelect(
        'ServerOrder.serverOrderCustomerDetails',
        'serverOrderCustomerDetails',
      )
      .leftJoinAndSelect(
        'ServerOrder.serverOrderDeliveryDetails',
        'serverOrderDeliveryDetails',
      )
      .leftJoinAndSelect(
        'ServerOrder.serverOrderProductDetails',
        'serverOrderProductDetails',
      );

    if (brewer) {
      let orderIds = await this.serverOrderProductDetailsRepository
        .createQueryBuilder('ServerOrderProductDetails')
        .where('ServerOrderProductDetails.brewer = :brewer', { brewer })
        .select('DISTINCT(ServerOrderProductDetails.orderId)', 'id')
        .getRawMany();
      if (orderIds.length > 0) {
        table.where('ServerOrder.orderId IN (:...ids) ', {
          ids: orderIds.map((x) => x.id),
        });
      } else {
        return [];
      }
    }

    if (status_id) {
      table.andWhere('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status_id,
      });
      if (cancelledby === 'customer') {
        table.andWhere('ServerOrder.cancelledByCustomer = :cancelStatus', {
          cancelStatus: 1,
        });
      } else if (cancelledby === 'store') {
        table.andWhere('ServerOrder.cancelledByDriver = :driverStatus', {
          driverStatus: 0,
        });
        table.andWhere('ServerOrder.cancelledByCustomer = :customerStatus', {
          customerStatus: 0,
        });
      }
    }

    if (store_id) {
      table.andWhere('ServerOrder.storeId = :storeId', {
        storeId: store_id,
      });
    }

    if (min_date_created && max_date_created) {
      const minDate = moment.utc(min_date_created).format('YYYY-MM-DD');
      const maxDate = moment.utc(max_date_created).format('YYYY-MM-DD');
      const fromDate =  moment.utc(`${minDate} 00:00:00`, 'YYYY-MM-DD HH:mm:ss').tz(this.configService.get('timezone').zone).format('');
        const toDate =  moment.utc(`${maxDate} 23:59:59`, 'YYYY-MM-DD HH:mm:ss').tz(this.configService.get('timezone').zone).format(''); 
      console.log('ee', fromDate, toDate);
      if (min_date_created && max_date_created) {
        // if (status_id) {
          table.andWhere(
            `ServerOrder.orderDate BETWEEN :fromDate AND :toDate`,
            {
              fromDate,
              toDate,
            },
          );
        // } else {
        //   table.andWhere(
        //     new Brackets((qb) => {
        //       qb.where(
        //         'ServerOrder.completedDateTime BETWEEN :compFromDate AND :compToDate',
        //         {
        //           compFromDate: fromDate,
        //           compToDate: toDate,
        //         },
        //       )
        //         .orWhere(
        //           'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
        //           {
        //             fromDate,
        //             toDate,
        //           },
        //         )
        //         .orWhere(
        //           'ServerOrder.pickUpReadyDateTime BETWEEN :pickfromDate AND :picktoDate',
        //           {
        //             pickfromDate: fromDate,
        //             picktoDate: toDate,
        //           },
        //         )
        //         .orWhere(
        //           'ServerOrder.cancellationDate BETWEEN :cancelfromDate AND :canceltoDate',
        //           {
        //             cancelfromDate: fromDate,
        //             canceltoDate: toDate,
        //           },
        //         )
        //         .orWhere(
        //           'ServerOrder.intransitDate BETWEEN :transitfromDate AND :transittoDate',
        //           {
        //             transitfromDate: fromDate,
        //             transittoDate: toDate,
        //           },
        //         );
        //     }),
        //   );
        // }
      }
    }

    if (vector) {
      table.andWhere('ServerOrder.orderVector = :orderVector', {
        orderVector: vector,
      });
    }
    const orders = await table.getMany();
    const parsedOrders =  orders.map(order => {
      // console.log('order', order.orderId, order?.orderDate,
      // momentTz(order.orderDate).tz(
      //   this.configService.get('timezone').zone,
      // ).format("YYYY/MM/DD - hh:mm A")
      // );
      return {
        ...order,
        orderDate: order?.orderDate
          ? momentTz(order.orderDate).tz(
            this.configService.get('timezone').zone,
          ).format("YYYY-MM-DD hh:mm A")
          : '',
        cancellationDate: order?.cancellationDate
          ? momentTz(order.cancellationDate).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '',
          createdDate: order?.createdDate
          ? momentTz(order.createdDate).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '',
        openDateTime: order?.openDateTime
          ? momentTz(order.openDateTime).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '',
        submittedDateTime: order?.submittedDateTime
        ? momentTz(order.submittedDateTime).tz(
            this.configService.get('timezone').zone,
          ).format("YYYY-MM-DD hh:mm A")
        : '', 
        pickUpReadyDateTime: order?.pickUpReadyDateTime
        ? momentTz(order.pickUpReadyDateTime).tz(
            this.configService.get('timezone').zone,
          ).format("YYYY-MM-DD hh:mm A")
        : '', 
        completedDateTime: order?.completedDateTime
        ? momentTz(order.completedDateTime).tz(
            this.configService.get('timezone').zone,
          ).format("YYYY-MM-DD hh:mm A")
        : '',
        requestedPickUpTime: order?.requestedPickUpTime
        ? momentTz(order.requestedPickUpTime).tz(
            this.configService.get('timezone').zone,
          ).format("YYYY-MM-DD hh:mm A")
        : '',
        intransitDate: order?.intransitDate
        ? momentTz(order.intransitDate).tz(
            this.configService.get('timezone').zone,
          ).format("YYYY-MM-DD hh:mm A")
        : '',
      };
    });
    return parsedOrders;
  }

  private async generateOrderReportData(
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string,
    cancelledby: string,
  ): Promise<Object> {
    const serverOrderQuery = this.serverOrderRepository
      .createQueryBuilder('ServerOrder')
      .select('DISTINCT(ServerOrder.orderId)', 'id');

    if (status_id) {
      serverOrderQuery.andWhere('ServerOrder.orderStatus = :orderStatus', {
        orderStatus: status_id,
      });
      if (cancelledby === 'customer') {
        serverOrderQuery.andWhere(
          'ServerOrder.cancelledByCustomer = :cancelStatus',
          {
            cancelStatus: 1,
          },
        );
      } else if (cancelledby === 'store') {
        serverOrderQuery.andWhere(
          'ServerOrder.cancelledByDriver = :driverStatus',
          {
            driverStatus: 0,
          },
        );
        serverOrderQuery.andWhere(
          'ServerOrder.cancelledByCustomer = :customerStatus',
          {
            customerStatus: 0,
          },
        );
      }
    }
    if (store_id) {
      serverOrderQuery.andWhere('ServerOrder.storeId = :storeId', {
        storeId: store_id,
      });
    }

    if (min_date_created && max_date_created) {
      const minDate = moment.utc(min_date_created).format('YYYY-MM-DD');
      const maxDate = moment.utc(max_date_created).format('YYYY-MM-DD');
      const fromDate =  moment.utc(`${minDate} 00:00:00`, 'YYYY-MM-DD HH:mm:ss').tz(this.configService.get('timezone').zone).format('');
        const toDate =  moment.utc(`${maxDate} 23:59:59`, 'YYYY-MM-DD HH:mm:ss').tz(this.configService.get('timezone').zone).format(''); 
      console.log('ee', fromDate, toDate);
      if (min_date_created && max_date_created) {
        // if (status_id) {
          serverOrderQuery.andWhere(
            `ServerOrder.orderDate BETWEEN :fromDate AND :toDate`,
            {
              fromDate,
              toDate,
            },
          );
        // } else {
        //   serverOrderQuery.andWhere(
        //     new Brackets((qb) => {
        //       qb.where(
        //         'ServerOrder.completedDateTime BETWEEN :compFromDate AND :compToDate',
        //         {
        //           compFromDate: fromDate,
        //           compToDate: toDate,
        //         },
        //       )
        //         .orWhere(
        //           'ServerOrder.orderDate BETWEEN :fromDate AND :toDate',
        //           {
        //             fromDate,
        //             toDate,
        //           },
        //         )
        //         .orWhere(
        //           'ServerOrder.pickUpReadyDateTime BETWEEN :pickfromDate AND :picktoDate',
        //           {
        //             pickfromDate: fromDate,
        //             picktoDate: toDate,
        //           },
        //         )
        //         .orWhere(
        //           'ServerOrder.cancellationDate BETWEEN :cancelfromDate AND :canceltoDate',
        //           {
        //             cancelfromDate: fromDate,
        //             canceltoDate: toDate,
        //           },
        //         )
        //         .orWhere(
        //           'ServerOrder.intransitDate BETWEEN :transitfromDate AND :transittoDate',
        //           {
        //             transitfromDate: fromDate,
        //             transittoDate: toDate,
        //           },
        //         );
        //     }),
        //   );
        // }
      }
    }

    if (vector) {
      serverOrderQuery.andWhere('ServerOrder.orderVector = :orderVector', {
        orderVector: vector,
      });
    }

    const ids = (await serverOrderQuery.getRawMany()).map((x) => x.id);

    if (ids.length <= 0) {
      return [];
    } else {
      const query = this.serverOrderProductDetailsRepository.createQueryBuilder(
        'ServerOrderProductDetails',
      );
      query
        .where('ServerOrderProductDetails.orderId IN (:...ids)', { ids })
        .leftJoinAndSelect(
          'ServerOrderProductDetails.serverOrder',
          'serverOrderDetails',
        )
        .leftJoinAndSelect(
          'serverOrderDetails.serverOrderCustomerDetails',
          'serverOrderCustomer',
        );
      if (brewer) {
        query.andWhere('ServerOrderProductDetails.brewer = :brewer', {
          brewer,
        });
      }
      // return query.getMany();
      const orders = await query.getMany();
      const parsedOrders =  orders.map(order => {
        const serverOrderData = order?.serverOrder;
        return {
          ...order,
          serverOrder: {
            ...order.serverOrder,
            orderDate: serverOrderData?.orderDate
            ? momentTz(serverOrderData?.orderDate).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
            : '',
          cancellationDate: serverOrderData?.cancellationDate
            ? momentTz(serverOrderData?.cancellationDate).tz(
                this.configService.get('timezone').zone,
              ).format("YYYY-MM-DD hh:mm A")
            : '',
            createdDate: serverOrderData?.createdDate
            ? momentTz(serverOrderData.createdDate).tz(
                this.configService.get('timezone').zone,
              ).format("YYYY-MM-DD hh:mm A")
            : '',
          openDateTime: serverOrderData?.openDateTime
            ? momentTz(serverOrderData.openDateTime).tz(
                this.configService.get('timezone').zone,
              ).format("YYYY-MM-DD hh:mm A")
            : '',
          submittedDateTime: serverOrderData?.submittedDateTime
          ? momentTz(serverOrderData.submittedDateTime).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '', 
          pickUpReadyDateTime: serverOrderData?.pickUpReadyDateTime
          ? momentTz(serverOrderData.pickUpReadyDateTime).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '', 
          completedDateTime: serverOrderData?.completedDateTime
          ? momentTz(serverOrderData.completedDateTime).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '',
          requestedPickUpTime: serverOrderData?.requestedPickUpTime
          ? momentTz(serverOrderData.requestedPickUpTime).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '',
          intransitDate: serverOrderData?.intransitDate
          ? momentTz(serverOrderData.intransitDate).tz(
              this.configService.get('timezone').zone,
            ).format("YYYY-MM-DD hh:mm A")
          : '',
          }
        } 
      });
      return parsedOrders;
    }
  }

  async completeDetail(orderId: number, storeId: number) {
    try {
      const resp = await Promise.all([
        this.ordersService.getOrderDetails(`${orderId}`),
        this.serverOrderRepository.findOne({
          where: { orderId },
          relations: ['serverOrderCustomerDetails'],
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
        orderId: serverOrder.orderId,
      },
    });

    if (order !== undefined) {
      return 'Order Already exist';
    }

    try {
      const products: ProductsDataEntity[] = serverOrder.productsData;
      const orderDetails: OrderData = serverOrder.orderData;
      const transactionDetails: MetaOrPaymentData = serverOrder.paymentData;

      const billingAddressFormFields = JSON.parse(
        orderDetails?.billing_address?.form_fields[0]?.value,
      );
      let customerType;
      if (orderDetails?.customer_id) {
         customerType = await this.getCustomerType(
          orderDetails.customer_id,
        );
      }
      this.orderHistoryService.create({
        orderId: `${orderDetails.id}`,
        orderStatus: 11,
        name: 'Order Queue',
        identifier: '',
      });

      const deliveryDetails = {
        orderId: `${orderDetails.id}`,
        deliveryId: null,
        deliveryGuyName: null,
        deliveryDate: null,
        deliveryAddress: `${orderDetails.billing_address.street_1}, ${
          orderDetails.billing_address.street_2
        } ${orderDetails.billing_address.street_2 ? ',' : ''}${
          orderDetails.billing_address.city
        }${orderDetails.billing_address.city ? ',' : ''}${
          orderDetails.billing_address.state
        }${orderDetails.billing_address.state ? ',' : ''}${
          orderDetails.billing_address.zip
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
        dob: billingAddressFormFields.dob
          ? moment(billingAddressFormFields.dob, 'DD-MM-YYYY').format(
              'YYYY-MM-DD',
            )
          : null,
        salutation: billingAddressFormFields.salutation,
        customerType: customerType?.userType || '',
        ccType: transactionDetails?.card?.card_type || null,
        cardNumber: +transactionDetails?.card?.last_four || null,
        cardAmount: +transactionDetails?.amount || 0,
        authCode: +transactionDetails?.auth_code || null,
      };

      // console.log('customerDetails', customerDetails);

      let singleUnits = 0;
      let twoSixUnits = 0;
      let eightEighteenUnits = 0;
      let twentyFourPlusUnits = 0;
      let volumeTotalHL = 0;
      let mailProductsArr = [];
      let saleSavings = 0;
      let productTotal = 0;

      let productsArr = products.map((product, index) => {
        let temp = product?.product_options[0]?.display_value?.split(' ');
        let packSize = temp[0] || 0;
        let volume = temp[3] || 0;
        let containerType = temp[2] || '';

        if (packSize == 1) {
          singleUnits += product?.quantity || 0;
        } else if (packSize >= 2 && packSize <= 6) {
          twoSixUnits += product?.quantity || 0;
        } else if (packSize >= 8 && packSize <= 18) {
          eightEighteenUnits += product?.quantity || 0;
        } else if (packSize >= 24) {
          twentyFourPlusUnits += product?.quantity || 0;
        }

        let hlTotal = (product.quantity * +packSize * +volume) / 1000 / 100;
        volumeTotalHL += hlTotal;

        let itemDescription = '';
        const customFields = product?.product?.data?.custom_fields || [];
        const pageTitle = product?.product?.data?.page_title || '';
        if (pageTitle) {
          itemDescription = pageTitle.split('~')[0] || '';
        }
        let brewer = '';
        let category = '';
        if (customFields.length > 0) {
          brewer =
            customFields.find((field) => field.name === 'Producer')?.value ||
            '';
          category =
            customFields.find((field) => field.name === 'Category')?.value ||
            '';
        }

        let imageUrl = product.product?.data?.custom_fields.find(
          (x) => x.name === 'product_image_1',
        )?.value;
        let variantData = product.product.data.variants.find(
          (x) => x.id === product.variant_id,
        );
        // console.log('variantData', variantData);
        //calculating the sale price
        if (variantData.sale_price !== variantData.price) {
          saleSavings += variantData.price - variantData.sale_price;
        }

        productTotal += +product.total_inc_tax;
        return {
          orderId: `${orderDetails.id}`,
          productId: product.product_id,
          variantId: product.variant_id,
          lineItem: index + 1,
          itemSKU: product.sku,
          itemDescription,
          brewer,
          category,
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
          tbsArticleId: product?.sku?.split('_')?.[0] || '',
          tbsProductId: product?.product?.data?.sku?.split('_')?.[0] || '',
        };
      });
      const timeSplit =
        billingAddressFormFields.pick_delivery_time.split('-') || '';
      const orderDeliveryDate =
        billingAddressFormFields.pick_delivery_date_text;
      
      //   const fulfillmentDate = moment(
      //   `${orderDeliveryDate} ${timeSplit[0]}`,
      //   'YYYY-MM-DD HH:mm A',
      // ).format('YYYY-MM-DD HH:mm:ss');

      // const fulfillmentDate = moment
      //   .utc(`${orderDeliveryDate} ${timeSplit[0]}`)
      //   .format('YYYY-MM-DD HH:mm:ss');

      const fulfillmentDate = momentTz(
        `${orderDeliveryDate} ${timeSplit[0]}`,
        'YYYY-MM-DD HH:mm A',
      ).format('YYYY-MM-DD HH:mm:ss');

      let staffNotes = JSON.parse(orderDetails.staff_notes);
      let totalDiscount = 0;
      staffNotes.forEach((notes) => {
        totalDiscount += +notes.packup_discount;
      });
      const serverOrderParsed = {
        orderId: `${orderDetails.id}`,
        storeId: `${billingAddressFormFields.store_id}`,
        orderType:
          billingAddressFormFields.source === 'kiosk'
            ? 'kiosk'
            : billingAddressFormFields.order_type === 'pickup'
            ? billingAddressFormFields.pickup_type
            : billingAddressFormFields.order_type,
        orderStatus: orderDetails.status_id,
        fulfillmentDate,
        orderDate: moment
          .utc(orderDetails.date_created)
          .format('YYYY-MM-DD HH:mm:ss'), 
        cancellationDate: null,
        cancellationBy: null,
        cancellationReason: null,
        cancellationNote: null,
        transactionId: serverOrder.transactionId || null,
        orderVector: billingAddressFormFields.source,
        partialOrder: false,
        productTotal: productTotal - totalDiscount,
        deliveryFee: Number(
          parseFloat(orderDetails.shipping_cost_ex_tax).toFixed(2),
        ),
        deliveryFeeHST: Number(
          parseFloat(orderDetails.shipping_cost_tax).toFixed(2),
        ),
        grandTotal:
          productTotal +
          Number(parseFloat(orderDetails.shipping_cost_ex_tax).toFixed(2)) +
          Number(parseFloat(orderDetails.shipping_cost_tax).toFixed(2)) -
          +totalDiscount,
        volumeTotalHL,
        singleUnits: singleUnits,
        packUnits2_6: twoSixUnits,
        packUnits8_18: eightEighteenUnits,
        packUnits_24Plus: twentyFourPlusUnits,
        submittedDateTime: moment
          .utc(orderDetails.date_created)
          .format('YYYY-MM-DD hh:mm:ss'),
        // submittedDateTime: momentTz(orderDetails.date_created)
        //   .tz(this.configService.get('timezone').zone)
        //   .format('YYYY-MM-DD HH:mm:ss'),
        openDateTime: null,
        pickUpReadyDateTime: null,
        completedByEmpId: null,
        completedDateTime: null,
        idChecked: '',
        // requestedPickUpTime: `${orderDeliveryDate} ${orderDeliveryDate}`,
        requestedPickUpTime: fulfillmentDate,
        browserVersion: '',
        refunded: false,
        refundedAmount: 0,
        refundReason: '',
        pickUpType: billingAddressFormFields.pickup_type || '',
      };
      await this.serverOrderRepository.save(
        this.serverOrderRepository.create({
          ...serverOrderParsed,
          serverOrderCustomerDetails: customerDetails,
          serverOrderDeliveryDetails: deliveryDetails,
          serverOrderProductDetails: productsArr,
        }),
      );
      if (billingAddressFormFields.source !== 'kiosk') {
        const serverOrder = await this.serverOrderDetail(orderDetails.id);
        this.sendMailOnStatusChange(`${orderDetails.id}`, serverOrder, 11);
      }
      return 'Order placed';
    } catch (err) {
      console.log('err', err.message);
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

  async serverOrderDetail(orderId: number): Promise<ServerOrder> {
    const serverOrder = await this.serverOrderRepository.findOne(
      {
        orderId: `${orderId}`,
      },
      {
        relations: [
          'serverOrderProductDetails',
          'serverOrderDeliveryDetails',
          'serverOrderCustomerDetails',
        ],
      },
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
    orderDetails: CreateOrderDto,
    refundOrder: RefundOrderDto,
    createOrderDto: UpdateOrderDto,
    partial?: string,
    checkoutId?: string,
  ): Promise<any> {
    try {
      let updateBeerGuy = false;
      // const serverOrder = await this.serverOrderDetail(id);
      const orderRes = await Promise.all([
        this.serverOrderDetail(id),
        this.ordersService.getOrder(`${id}`),
      ]);
      const serverOrder = orderRes[0];
      const bigCommOrder = orderRes[1];
      serverOrder.orderStatus = orderStatus;
      serverOrder.partialOrder = partial !== '0';

      const refundQuote = {
        items: [],
        tax_adjustment_amount: 0,
      };
      if (+serverOrder.orderStatus === +8 || +serverOrder.orderStatus === +9) {
        serverOrder.pickUpReadyDateTime = moment.utc().format();
      }

      if (serverOrder?.orderStatus !== 3) {
        if (serverOrder?.serverOrderProductDetails) {
          refundOrder.products.forEach((product, _idx) => {
            const updatedProduct = serverOrder.serverOrderProductDetails.find(
              (prod) => product.sku === prod.itemSKU,
            );
            if (updatedProduct) {
              // serverOrder.serverOrderProductDetails[_idx].quantity =  updatedProduct.quantity;
              serverOrder.serverOrderProductDetails[_idx].quantity =
                +product.originalQty - +product.refundQty;
              if (+product.refundQty > 0) {
                refundQuote.items.push({
                  item_id: product.id,
                  item_type: 'PRODUCT',
                  quantity: product.refundQty,
                });
                if (+product.originalQty - +product.refundQty == 0) {
                  serverOrder.serverOrderProductDetails[_idx].itemTotal = 0.0;
                  serverOrder.serverOrderProductDetails[_idx].itemHLTotal = 0.0;
                }
              }
            }
          });
        }

        if (refundQuote.items.length > 0) {
          const paymentRefund = {
            ...refundQuote,
            payments: [
              {
                provider_id: 'storecredit',
                amount: -1,
                offline: false,
              },
            ],
          };
          const quotesRes = await this.ordersService.setRefundQuotes(
            id,
            refundQuote,
          );
          paymentRefund.payments[0].amount = quotesRes.data.total_refund_amount;
          const refundHandler = await this.ordersService.refundHandler(
            id,
            paymentRefund,
          );
          if (serverOrder.orderType === 'delivery') {
            updateBeerGuy = true;
          }
        }

        let staffNotes = JSON.parse(orderDetails?.staff_notes);
        let totalDiscount = 0;
        staffNotes?.forEach((notes) => {
          totalDiscount += +notes.packup_discount;
        });

        await this.ordersService.updateOrder(`${id}`, orderDetails);
        serverOrder.grandTotal =
          +createOrderDto.productTotal +
          +orderDetails.shipping_cost_inc_tax -
          +totalDiscount;
        serverOrder.productTotal =
          +createOrderDto.productTotal - +totalDiscount;
        serverOrder.deliveryFee = +orderDetails.shipping_cost_ex_tax;
        serverOrder.deliveryFeeHST =
          +orderDetails.shipping_cost_inc_tax -
          +orderDetails.shipping_cost_ex_tax;
        serverOrder.refundedAmount = +orderDetails.refunded_amount || 0;
        serverOrder.refunded = +orderDetails.refunded_amount > 0;
        serverOrder.volumeTotalHL = createOrderDto.volumeTotalHL;
        serverOrder.singleUnits = createOrderDto.singleUnits;
        serverOrder.packUnits2_6 = createOrderDto.packUnits2_6;
        serverOrder.packUnits8_18 = createOrderDto.packUnits8_18;
        serverOrder.packUnits_24Plus = createOrderDto.packUnits_24Plus;
      } else if (serverOrder?.orderStatus === 3) {
        await this.ordersService.updateOrder(`${id}`, {
          status_id: 3,
        });
      }

      const orderToSave = await this.serverOrderRepository.preload(serverOrder);

      const response = await Promise.all([
        this.serverOrderRepository.save(orderToSave),
        this.orderHistoryService.create(createOrderHistoryDto),
        // { ...(updateBeerGuy && this.updateBeerGuyOrder(bigCommOrder)) },
      ]);

      try {
        if (checkoutId && serverOrder?.orderType !== 'kiosk') {
          await this.sendPushNotification(
            this.configService.get('beerstoreApp').title,
            `Your Order #${id} has been ${OrderstatusText[orderStatus]}.`,
            checkoutId,
            id.toString(),
            +orderStatus,
            serverOrder.orderType,
          );
        }
      } catch (err) {}
      this.sendMailOnStatusChange(id?.toString(), serverOrder, orderStatus);
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // to do refactor code for tables change
  async handleBeerGuy(updateOrder: BeerGuyUpdateDto): Promise<ServerOrder> {
    try {
      const serverOrder = {
        orderStatus: +updateOrder.orderStatus,
        cancellationReason: updateOrder?.cancellationReason || '',
        cancellationBy: updateOrder?.cancellationBy || '',
        cancellationDate: moment.utc().format(),
      };
      const orderHistory = {
        orderId: updateOrder.orderId,
        orderStatus: updateOrder.orderStatus,
        name: updateOrder.driverName || 'The Beer Guy',
        identifier: '',
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
          await this.bamboraService.UpdatePaymentStatus(transactionId, {
            amount: 0,
          });
        }
      } else if (orderType === 'delivery') {
        await this.cancelBeerGuyOrder(`${id}`, cancellationReason);
      }
      const resp = await Promise.all([
        this.ordersService.updateOrder(`${id}`, {
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
      serverOrder.cancellationDate = moment.utc().format();
      serverOrder.cancellationReason = cancellationReason;
      serverOrder.cancellationNote = cancellationNote || '';
      serverOrder.cancelledByCustomer =
        cancellationBy.toLowerCase() === 'customer';
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
      this.sendMailOnStatusChange(`${id}`, serverOrder, +orderStatus);
      try {
        if (checkoutId && orderType !== 'kiosk') {
          this.sendPushNotification(
            this.configService.get('beerstoreApp').title,
            `Your Order #${id} has been cancelled.`,
            checkoutId,
            id.toString(),
            +serverOrder.orderStatus,
            orderType,
          );
        }
      } catch (err) {}
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
    const requests = [];
    try {
      const { amount, ...orderDetails } = serverOrder;
      let prevOrder = await this.serverOrderDetail(+orderId);
      console.log('prevOrder', prevOrder);
      if (
        prevOrder.orderType === 'pickup' ||
        prevOrder.orderType === 'curbside'
      ) {
        if (serverOrder?.transactionId) {
          await this.bamboraService.UpdatePaymentStatus(
            serverOrder.transactionId,
            {
              amount: Number(parseFloat(amount).toFixed(2)),
            },
          );
        }
      } else if (prevOrder.orderType === 'delivery') {
        // update beer guy
      }

      // if(prevOrder?.serverOrderProductDetails){
      //   createOrderDto.products.forEach((product, _idx) => {
      //     const updatedProduct = prevOrder.serverOrderProductDetails.find(prod => product.sku === prod.itemSKU);
      //     if(updatedProduct?.id){
      //       prevOrder.serverOrderProductDetails[_idx].quantity =  updatedProduct.quantity;
      //     }
      //   })
      // }

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
      };

      if (+serverOrder.orderStatus === 5) {
        //cancelled
        prevOrder = {
          ...prevOrder,
          cancellationDate: serverOrder.cancellationDate,
          cancellationBy: serverOrder.cancellationBy,
          cancellationReason: serverOrder.cancellationReason,
          cancellationNote: serverOrder.cancellationNote,
        };
      } else if (+serverOrder.orderStatus === 10) {
        //completed
        prevOrder = {
          ...prevOrder,
          completedDateTime: moment.utc().format(),
        };
      } else if (+serverOrder.orderStatus === 8) {
        prevOrder = {
          ...prevOrder,
          pickUpReadyDateTime: moment.utc().format(),
        };
      }
      if (+serverOrder.orderStatus === 3) {
        await this.ordersService.updateOrder(orderId, {
          status_id: 3,
        });
        prevOrder = {
          ...prevOrder,
          intransitDate: moment.utc().format(),
        };
      } else {
        await this.ordersService.updateOrder(orderId, createOrderDto);
      }
      const orderToSave = await this.serverOrderRepository.preload(prevOrder);
      // requests.push(this.updateServerOrder(+orderId, orderDetails));
      requests.push(this.serverOrderRepository.save(orderToSave));
      requests.push(this.orderHistoryService.create(createOrderHistoryDto));
      const response = await Promise.all(requests);
      this.sendMailOnStatusChange(orderId, prevOrder, serverOrder.orderStatus);
      try {
        if (checkoutId && prevOrder?.orderType !== 'kiosk') {
          this.sendPushNotification(
            this.configService.get('beerstoreApp').title,
            `Your Order #${orderId} has been ${
              OrderstatusText[serverOrder.orderStatus]
            }.`,
            checkoutId,
            orderId,
            +serverOrder.orderStatus,
            prevOrder.orderType,
          );
        }
      } catch (err) {}
      return response[0];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  private async sendMailOnStatusChange(
    orderId: string,
    serverOrderDetails: ServerOrder,
    orderStatus: number,
  ) {
    try {
      // console.log('orderId', serverOrderDetails.serverOrderProductDetails);
      const requests = [];
      let productIds = serverOrderDetails.serverOrderProductDetails
        .map((x) => `${x.productId}`)
        .join(',');
      requests.push(this.ordersService.getOrder(orderId));
      requests.push(this.ordersService.getOrderProducts(orderId));
      requests.push(
        this.beerService.findAll(
          undefined,
          undefined,
          productIds,
          undefined,
          undefined,
          'variants,custom_fields,images,primary_image',
          undefined,
          undefined,
          null,
        ),
      );
      let result = await Promise.all(requests);
      // console.log('beerservice', result);
      let { data } = result[2];
      const orderDetailsFromBigCom = result[0];
      let orderProductDetails = result[1];
      // console.log('orderData',  orderProductDetails);
      let billingAddressFormFields = JSON.parse(
        orderDetailsFromBigCom?.billing_address?.form_fields[0]?.value,
      );
      if (billingAddressFormFields.source !== 'kiosk') {
        let staffNotes = JSON.parse(orderDetailsFromBigCom.staff_notes);
        let mailProductsArr = [];
        let saleSavings = 0;
        // let totalRefundedAmount = 0;
        // let productFromdb;
        let productDetail;
        let subTotal = 0.0;
        serverOrderDetails?.serverOrderProductDetails.forEach((details) => {
          const ele = data.find(
            (product) => +product.id === +details.productId,
          );
          // console.log('ele', ele);
          let imageUrl = ele?.custom_fields.find(
            (x) => x.name === 'product_image_1',
          )?.value;
          // productFromdb = serverOrderDetails.serverOrderProductDetails.find(
          //   (x) => x.productId == ele.id,
          // );
          productDetail = orderProductDetails.find(
            (x) => x.variant_id === details.variantId,
          );
          const packupDiscountObj = staffNotes.find(
            (variant) => variant.variant_id === productDetail.variant_id,
          );
          const packupDiscount = packupDiscountObj?.packup_discount || 0;
          // console.log('packupDiscount-->', packupDiscount);
          let variantData = ele.variants.find((x) => {
            return x.id === productDetail.variant_id;
          });
          // console.log('productDetail', productDetail, variantData);
          const actualQuantity =
            +productDetail.quantity - +productDetail.quantity_refunded;
          if (variantData?.sale_price !== variantData?.price) {
            saleSavings +=
              variantData?.price * actualQuantity -
              variantData?.sale_price * actualQuantity;
          }
          // console.log('testing', saleSavings, variantData);
          // if (productDetail.is_refunded) {
          //   totalRefundedAmount += productDetail.refund_amount;
          // }
          const refundedPrice = +productDetail.quantity * +variantData.price;
          const productSubTotal =
            variantData?.sale_price === variantData?.price
              ? (variantData?.price * actualQuantity).toFixed(2)
              : (variantData?.sale_price * actualQuantity).toFixed(2) || 0.0;

          const salesSubTotal =
            (variantData?.sale_price * actualQuantity).toFixed(2) || 0.0;
          const maxSubTotal =
            (variantData?.price * actualQuantity).toFixed(2) || 0.0;
          const packupSubTotal = +salesSubTotal - +packupDiscount;
          const nameString = ele.name.split('~');

          const name = nameString[0].replace(/-/g, ' ')?.toUpperCase();

          // console.log('mailProductsArr', {
          //   imageUrl: imageUrl || '',
          //   name,
          //   displayValue: productDetail?.product_options[0]?.display_value || '',
          //   quantity: +productDetail.quantity,
          //   productSubTotal,
          //   price: (variantData.price).toFixed(2) || 0.00,
          //   salePrice: (variantData?.sale_price).toFixed(2) || 0.00,
          //   onSale: variantData?.sale_price === variantData.price ? false : true,
          //   packupDiscount,
          //   packupSubTotal: packupSubTotal.toFixed(2),
          //   isRefunded: (productDetail.quantity - +productDetail?.quantity_refunded) === 0,
          //   refundedQty: (productDetail?.quantity_refunded).toFixed(2)  || 0.00,
          //   refundedAmt: (refundedPrice).toFixed(2) || 0.00,
          // })
          if (packupDiscount) {
            subTotal = subTotal + +packupSubTotal;
          } else {
            subTotal = subTotal + +productSubTotal;
          }
          mailProductsArr.push({
            imageUrl: imageUrl || '',
            name,
            displayValue:
              productDetail?.product_options[0]?.display_value || '',
            quantity: +productDetail.quantity,
            productSubTotal,
            packupDiscount,
            packupSubTotal: packupSubTotal.toFixed(2),
            price: variantData.price.toFixed(2) || 0.0,
            salePrice: (variantData?.sale_price).toFixed(2) || 0.0,
            onSale:
              variantData?.sale_price === variantData.price ? false : true,
            isRefunded:
              productDetail.quantity - +productDetail?.quantity_refunded === 0,
            refundedQty: productDetail?.quantity_refunded || 0,
            refundedAmt: refundedPrice.toFixed(2) || 0.0,
          });
        });

        // console.log('mailProductsArr', mailProductsArr);
        const totalPackupSaving = staffNotes.reduce(
          (previousValue, currentValue) =>
            previousValue + +currentValue.packup_discount,
          0,
        );
        const grandTotal = (
          +subTotal + +orderDetailsFromBigCom.shipping_cost_inc_tax
        ).toFixed(2);

        let mailPayload = {
          to: serverOrderDetails.serverOrderCustomerDetails.email,
          orderDetails: {
            customerName: serverOrderDetails.serverOrderCustomerDetails.name,
            orderNumber: +orderId,
            orderDate: moment(serverOrderDetails.orderDate).format(
              'MMMM D, YYYY',
            ),
            storeContact: billingAddressFormFields?.store_contact || '',
            orderType: billingAddressFormFields.order_type,
            paymentMethod:
              orderDetailsFromBigCom?.payment_method === 'Cash'
                ? 'Cash'
                : 'Credit/Debit',
            totalCost: grandTotal,
            deliverydate: moment(
              billingAddressFormFields.pick_delivery_date_text,
            ).format('MMMM D, YYYY'),
            deliveryLocation:
              billingAddressFormFields.order_type === 'delivery'
                ? billingAddressFormFields.delivery_address
                : billingAddressFormFields.current_store_address,
            deliveryEstimatedTime:
              billingAddressFormFields.pick_delivery_time.toUpperCase(),
            subTotal: subTotal.toFixed(2) || '0.00',
            deliveryCharge:
              parseFloat(orderDetailsFromBigCom.shipping_cost_ex_tax).toFixed(
                2,
              ) || '0.00',
            deliveryFeeHST:
              parseFloat(orderDetailsFromBigCom.shipping_cost_tax).toFixed(2) ||
              '0.00',
            grandTotal,
            totalSavings: (saleSavings + +totalPackupSaving).toFixed(2),
            saleSavings: saleSavings.toFixed(2),
            packupSaving: totalPackupSaving.toFixed(2),
            cancellationReason: serverOrderDetails.cancellationReason || '',
            refundedAmt:
              parseFloat(orderDetailsFromBigCom.refunded_amount).toFixed(2) ||
              '0.00',
            refunded: mailProductsArr.find((x) => x.isRefunded === true)
              ? true
              : false,
          },
          orderProductDetails: mailProductsArr,
        };
        if (+orderStatus === 5) {
          this.mailService.orderCancelled({
            ...mailPayload,
            orderDetails: {
              ...mailPayload.orderDetails,
              refundedAmt: grandTotal,
            },
          });
        }

        if (+orderStatus === 11) {
          this.mailService.orderCreated(mailPayload);
        }

        if (+orderStatus === 10) {
          this.mailService.orderCompleted(mailPayload);
        }

        if (+orderStatus === 3) {
          this.mailService.orderInTransit(mailPayload);
        }

        // console.log(
        //   'orderType',
        //   billingAddressFormFields.order_type,
        //   billingAddressFormFields.pickup_type,
        //   orderStatus
        // );
        if (+orderStatus === 8 || +orderStatus === 9) {
          if (
            billingAddressFormFields.order_type === 'pickup' &&
            billingAddressFormFields.pickup_type === 'curbside'
          ) {
            this.mailService.orderCurbsideConfirmed(mailPayload);
          } else {
            this.mailService.orderConfirmed(mailPayload);
          }
        }
      }
    } catch (error) {
      console.log(error, 'MAIL ERR');
    }
  }

  sendPushNotification = async (
    title: string,
    subtitle: string,
    checkoutId: string,
    order_id: string,
    orderStatus: number,
    orderType: string,
  ) => {
    const payload = {
      title,
      subtitle,
      checkoutId,
      order_id,
      orderStatus,
      orderType,
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

  getCustomerType = async (customerId: number) => {
    const customerType = await lastValueFrom(
      this.httpService
        .get(
          `${
            this.configService.get('beerstoreApp').url
          }/auth/checkCustomerType/${customerId}`,
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
    return customerType;
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

  updateBeerGuyOrder = async (bigCommOrder: any) => {
    // console.log('orderId', bigCommOrder);
    const {
      id,
      customer_id,
      billing_address,
      customer_message,
      total_inc_tax,
      base_shipping_cost,
      shipping_cost_tax,
      payment_method,
      total_tax,
    } = bigCommOrder;
    const formFieldsObj = billing_address.form_fields[0];
    const sequenceArr = billing_address.form_fields[1].value;
    const sequence = JSON.parse(sequenceArr);
    let products = [];
    let productSequence;
    let orderProduct;

    const productIds = [];
    sequence.forEach((product) => {
      productIds.push(product.product_id);
    });

    const productDetails = await this.beerService.findAll(
      undefined,
      undefined,
      productIds.toString(),
      undefined,
      undefined,
      'variants,custom_fields,images,primary_image',
      undefined,
      undefined,
      null,
    );
    let productSkews = {};
    productDetails?.data?.forEach((details) => {
      productSkews[details.id] = details.sku.split('_')[0];
    });

    sequence.forEach((product) => {
      const skuStr = product.sku;
      const sku = skuStr.split('_')[0];
      // productIds.push(product.product_id);
      productSequence = product.sequence;
      if (Array.isArray(productSequence) && productSequence.length > 0) {
        if (productSequence[0]?.sale) {
          const variant = productSequence[0]?.sale?.variant;
          if (variant) {
            const currentPrice = variant?.price_info?.value?.current_price;
            orderProduct = {
              tbs_product_id: productSkews[product.product_id] || '',
              tbs_article_id: sku,
              price: currentPrice?.total_price,
              hst: currentPrice?.tax[0].tax_amount || 0.0,
              isSale: variant?.price_info?.value?.on_sale !== 'N',
              name: variant?.variant_info?.label,
              deposit: currentPrice.deposit,
              quantity: productSequence[0]?.sale?.quantity || 0,
            };
          }
        }
        if (productSequence[0]?.sub) {
          const { variant, quantity } = productSequence[0]?.sub || {
            quantity: 0,
          };
          if (variant) {
            const currentPrice = variant?.price_info?.value?.current_price;
            const taxAmount = currentPrice?.tax[0].tax_amount || 0.0;
            orderProduct.sub = {
              tbs_article_id: sku,
              tbs_product_id: productSkews[product.product_id] || '',
              price: (quantity * +currentPrice.total_price).toFixed(2),
              hst: (quantity * taxAmount).toFixed(2),
              deposit: (quantity * +currentPrice.deposit).toFixed(2),
              quantity,
            };
          }
        }
        products.push(orderProduct);
      }
    });

    const {
      store_id,
      checkout_id,
      delivery_phone,
      order_email,
      pick_delivery_date_text,
      pick_delivery_time,
      order_type,
      delivery_address,
      buzzer,
      dob,
      salutation,
    } = JSON.parse(formFieldsObj.value);

    const payload = {
      tbs_shopping_cart_id: checkout_id,
      tbs_purchase_id: id,
      tbs_customer_id: customer_id,
      tbs_location_id: store_id,
      beer_xpress_location_id: store_id,
      name: `${billing_address.first_name} ${billing_address.last_name}`,
      products,
      phone: delivery_phone,
      email: order_email,
      purchase_extra: customer_message,
      schedule_date: pick_delivery_date_text,
      schedule_time: pick_delivery_time,
      order_type,
      cell: delivery_phone,
      total_price: total_inc_tax,
      delivery_fee: base_shipping_cost,
      delivery_hst: shipping_cost_tax,
      delivery_payment_type_id: 2,
      order_type_id: 2,
      payment_type: payment_method === 'cash' ? 'cash' : 'Credit/Debit',
      address: delivery_address,
      addr2: '',
      buzzer,
      intersection: '',
      location_extra: customer_message,
      hst_amount: total_tax,
      deposit_amount: '',
      dob,
      salutation,
    };

    const params = new URLSearchParams({
      api_key: this.configService.get('thebeerguy').key,
    });
    const updateOrderRes = await lastValueFrom(
      this.httpService
        .post<{ result: string; output: string }>(
          `${
            this.configService.get('thebeerguy').url
          }/purchase/update/?${params.toString()}`,
          payload,
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            const message = err.message;
            console.log('err-message', message);
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
    console.log('beerguy update order', updateOrderRes);
    return updateOrderRes;
  };

  orderStatusDate = (orderStatus: number) => {
    switch (orderStatus) {
      case 11:
        return 'ServerOrder.orderDate BETWEEN :fromDate AND :toDate';
      case 10:
        return `ServerOrder.completedDateTime BETWEEN :fromDate AND :toDate`;
      case 8:
      case 9:
        return 'ServerOrder.pickUpReadyDateTime BETWEEN :fromDate AND :toDate';
      case 5:
        return `ServerOrder.cancellationDate BETWEEN :fromDate AND :toDate`;
      case 3:
        return `ServerOrder.intransitDate BETWEEN :fromDate AND :toDate`;
      default:
        'ServerOrder.orderDate BETWEEN :fromDate AND :toDate';
    }
  };
}
