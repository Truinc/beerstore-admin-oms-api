import {
  BadRequestException,
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
      ];
      let sortObjKey;
      const sortKey = Object.keys(sort)[0];
      if(sortKey.includes('name')){
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

  // async addCustomerProof(customerProof: CreateCustomerProofDto) {
  //   try {
  //     let id;
  //     const { orderId } = customerProof;
  //     const prevProof = await this.customerProofRepository.findOne({
  //       where: { orderId },
  //     });
  //     if (prevProof) {
  //       id = prevProof.id;
  //       await this.updateCustomerProof(+orderId, customerProof);
  //     } else {
  //       const createCustomerProof = await this.customerProofRepository.create(
  //         customerProof,
  //       );
  //       const response = await this.customerProofRepository.save(
  //         createCustomerProof,
  //       );
  //       id = response.id;
  //     }
  //     return this.customerProofRepository.findOne(id);
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }

  async getCustomerProof(orderId: number) {
    const customerProof = await this.customerProofRepository.findOne({
      where: { orderId },
    });
    return customerProof;
  }

  // async updateCustomerProof(
  //   orderId: number,
  //   updatedProof: UpdateCustomerProofDto,
  // ) {
  //   const customerProof = await this.getCustomerProof(orderId);
  //   if (customerProof) {
  //     await this.customerProofRepository.update(customerProof.id, updatedProof);
  //     return this.customerProofRepository.findOne(customerProof.id);
  //   } else {
  //     throw new NotFoundException('Customer proof not found');
  //   }
  // }

  // async addPaymentDetail(paymentDetail: CreatePaymentDetailsDto) {
  //   try {
  //     const createPaymentDetail = await this.paymentDetailsRepository.create(
  //       paymentDetail,
  //     );
  //     const response = await this.paymentDetailsRepository.save(
  //       createPaymentDetail,
  //     );
  //     // console.log('response', response);
  //     return this.paymentDetailsRepository.findOne(response.id);
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }

  // async getPaymentDetail(orderId: number) {
  //   const paymentDetail = await this.paymentDetailsRepository.findOne({
  //     where: { orderId },
  //   });
  //   return paymentDetail;
  // }

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
      console.log('products', products, orderDetails, transactionDetails);
      // const serverOrder = {
      //   products: [
      //     {
      //         "id": 9211,
      //         "order_id": 7755,
      //         "product_id": 2979965,
      //         "variant_id": 13879107,
      //         "order_address_id": 7659,
      //         "name": "ace-hill-vienna-lager~2410",
      //         "name_customer": "ace-hill-vienna-lager~2410",
      //         "name_merchant": "ace-hill-vienna-lager~2410",
      //         "sku": "3142004_2410",
      //         "upc": "",
      //         "type": "physical",
      //         "base_price": "3.3500",
      //         "price_ex_tax": "3.3500",
      //         "price_inc_tax": "3.3500",
      //         "price_tax": "0.0000",
      //         "base_total": "60.3000",
      //         "total_ex_tax": "60.3000",
      //         "total_inc_tax": "60.3000",
      //         "total_tax": "0.0000",
      //         "weight": "1.0000",
      //         "width": "0.0000",
      //         "height": "0.0000",
      //         "depth": "0.0000",
      //         "quantity": 18,
      //         "base_cost_price": "0.0000",
      //         "cost_price_inc_tax": "0.0000",
      //         "cost_price_ex_tax": "0.0000",
      //         "cost_price_tax": "0.0000",
      //         "is_refunded": false,
      //         "quantity_refunded": 0,
      //         "refund_amount": "0.0000",
      //         "return_id": 0,
      //         "wrapping_name": "",
      //         "base_wrapping_cost": "0.0000",
      //         "wrapping_cost_ex_tax": "0.0000",
      //         "wrapping_cost_inc_tax": "0.0000",
      //         "wrapping_cost_tax": "0.0000",
      //         "wrapping_message": "",
      //         "quantity_shipped": 0,
      //         "event_name": null,
      //         "event_date": "",
      //         "fixed_shipping_cost": "0.0000",
      //         "ebay_item_id": "",
      //         "ebay_transaction_id": "",
      //         "option_set_id": null,
      //         "parent_order_product_id": null,
      //         "is_bundled_product": false,
      //         "bin_picking_number": "",
      //         "external_id": null,
      //         "fulfillment_source": "",
      //         "applied_discounts": [
      //             {
      //                 "id": "manual-discount",
      //                 "amount": "5.5500",
      //                 "name": "Manual Discount",
      //                 "code": null,
      //                 "target": "order"
      //             }
      //         ],
      //         "product_options": [
      //             {
      //                 "id": 9239,
      //                 "option_id": 2960573,
      //                 "order_product_id": 9211,
      //                 "product_option_id": 2960653,
      //                 "display_name": "Beer",
      //                 "display_name_customer": "Beer",
      //                 "display_name_merchant": "Beer",
      //                 "display_value": "1 X Can 473 ml",
      //                 "display_value_customer": "1 X Can 473 ml",
      //                 "display_value_merchant": "1 X Can 473 ml",
      //                 "value": "11294647",
      //                 "type": "Multiple choice",
      //                 "name": "Beer1648116620-2979965",
      //                 "display_style": "Rectangle"
      //             }
      //         ],
      //         "configurable_fields": [],
      //         "product": {
      //             "data": {
      //                 "id": 2979965,
      //                 "name": "ace-hill-vienna-lager~2410",
      //                 "type": "physical",
      //                 "sku": "1712_2410",
      //                 "description": "An easy-drinking Vienna-style amber lager with slow roasted caramel malts and a fine balance of character and smoothness.",
      //                 "weight": 1,
      //                 "width": 0,
      //                 "depth": 0,
      //                 "height": 0,
      //                 "price": 36.25,
      //                 "cost_price": 0,
      //                 "retail_price": 0,
      //                 "sale_price": 0,
      //                 "map_price": 0,
      //                 "tax_class_id": 0,
      //                 "product_tax_code": "",
      //                 "calculated_price": 36.25,
      //                 "categories": [
      //                     596,
      //                     329,
      //                     365,
      //                     336,
      //                     367,
      //                     347,
      //                     332,
      //                     337,
      //                     348,
      //                     338,
      //                     334,
      //                     333
      //                 ],
      //                 "brand_id": 601,
      //                 "option_set_id": 2960556,
      //                 "option_set_display": "right",
      //                 "inventory_level": 126,
      //                 "inventory_warning_level": 0,
      //                 "inventory_tracking": "variant",
      //                 "reviews_rating_sum": 0,
      //                 "reviews_count": 0,
      //                 "total_sold": 0,
      //                 "fixed_cost_shipping_price": 0,
      //                 "is_free_shipping": false,
      //                 "is_visible": true,
      //                 "is_featured": false,
      //                 "related_products": [
      //                     -1
      //                 ],
      //                 "warranty": "",
      //                 "bin_picking_number": "",
      //                 "layout_file": "",
      //                 "upc": "",
      //                 "mpn": "",
      //                 "gtin": "",
      //                 "search_keywords": "",
      //                 "availability": "available",
      //                 "availability_description": "",
      //                 "gift_wrapping_options_type": "any",
      //                 "gift_wrapping_options_list": [],
      //                 "sort_order": 0,
      //                 "condition": "New",
      //                 "is_condition_shown": false,
      //                 "order_quantity_minimum": 0,
      //                 "order_quantity_maximum": 0,
      //                 "page_title": "ACE HILL VIENNA LAGER~2410",
      //                 "meta_keywords": [],
      //                 "meta_description": "",
      //                 "date_created": "2022-03-24T10:10:20+00:00",
      //                 "date_modified": "2022-05-20T06:24:36+00:00",
      //                 "view_count": 0,
      //                 "preorder_release_date": null,
      //                 "preorder_message": "",
      //                 "is_preorder_only": false,
      //                 "is_price_hidden": false,
      //                 "price_hidden_label": "",
      //                 "custom_url": {
      //                     "url": "/dnu-ace-hill-vienna-lager-2410/",
      //                     "is_customized": false
      //                 },
      //                 "base_variant_id": null,
      //                 "open_graph_type": "product",
      //                 "open_graph_title": "",
      //                 "open_graph_description": "",
      //                 "open_graph_use_meta_description": true,
      //                 "open_graph_use_product_name": true,
      //                 "open_graph_use_image": true,
      //                 "variants": [
      //                     {
      //                         "id": 13879107,
      //                         "product_id": 2979965,
      //                         "sku": "3142004_2410",
      //                         "sku_id": 10917088,
      //                         "price": 3.35,
      //                         "calculated_price": 3.35,
      //                         "sale_price": 3.35,
      //                         "retail_price": null,
      //                         "map_price": null,
      //                         "weight": null,
      //                         "calculated_weight": 1,
      //                         "width": null,
      //                         "height": null,
      //                         "depth": null,
      //                         "is_free_shipping": false,
      //                         "fixed_cost_shipping_price": null,
      //                         "purchasing_disabled": false,
      //                         "purchasing_disabled_message": "",
      //                         "image_url": "",
      //                         "cost_price": 0,
      //                         "upc": "",
      //                         "mpn": "",
      //                         "gtin": "",
      //                         "inventory_level": 126,
      //                         "inventory_warning_level": 0,
      //                         "bin_picking_number": "",
      //                         "option_values": [
      //                             {
      //                                 "id": 11294647,
      //                                 "label": "1 X Can 473 ml",
      //                                 "option_id": 2960653,
      //                                 "option_display_name": "Beer"
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         "id": 13879108,
      //                         "product_id": 2979965,
      //                         "sku": "3142028_2410",
      //                         "sku_id": 10917089,
      //                         "price": 205.65,
      //                         "calculated_price": 205.65,
      //                         "sale_price": 205.65,
      //                         "retail_price": null,
      //                         "map_price": null,
      //                         "weight": null,
      //                         "calculated_weight": 1,
      //                         "width": null,
      //                         "height": null,
      //                         "depth": null,
      //                         "is_free_shipping": false,
      //                         "fixed_cost_shipping_price": null,
      //                         "purchasing_disabled": false,
      //                         "purchasing_disabled_message": "",
      //                         "image_url": "",
      //                         "cost_price": 0,
      //                         "upc": "",
      //                         "mpn": "",
      //                         "gtin": "",
      //                         "inventory_level": 0,
      //                         "inventory_warning_level": 0,
      //                         "bin_picking_number": "",
      //                         "option_values": [
      //                             {
      //                                 "id": 11294648,
      //                                 "label": "1 X Keg 30000 ml",
      //                                 "option_id": 2960653,
      //                                 "option_display_name": "Beer"
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         "id": 13879109,
      //                         "product_id": 2979965,
      //                         "sku": "3142038_2410",
      //                         "sku_id": 10917090,
      //                         "price": 18.5,
      //                         "calculated_price": 18.5,
      //                         "sale_price": 18.5,
      //                         "retail_price": null,
      //                         "map_price": null,
      //                         "weight": null,
      //                         "calculated_weight": 1,
      //                         "width": null,
      //                         "height": null,
      //                         "depth": null,
      //                         "is_free_shipping": false,
      //                         "fixed_cost_shipping_price": null,
      //                         "purchasing_disabled": false,
      //                         "purchasing_disabled_message": "",
      //                         "image_url": "",
      //                         "cost_price": 0,
      //                         "upc": "",
      //                         "mpn": "",
      //                         "gtin": "",
      //                         "inventory_level": 0,
      //                         "inventory_warning_level": 0,
      //                         "bin_picking_number": "",
      //                         "option_values": [
      //                             {
      //                                 "id": 11294649,
      //                                 "label": "6 X Can 473 ml",
      //                                 "option_id": 2960653,
      //                                 "option_display_name": "Beer"
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         "id": 13879110,
      //                         "product_id": 2979965,
      //                         "sku": "3142041_2410",
      //                         "sku_id": 10917091,
      //                         "price": 69.95,
      //                         "calculated_price": 69.95,
      //                         "sale_price": 69.95,
      //                         "retail_price": null,
      //                         "map_price": null,
      //                         "weight": null,
      //                         "calculated_weight": 1,
      //                         "width": null,
      //                         "height": null,
      //                         "depth": null,
      //                         "is_free_shipping": false,
      //                         "fixed_cost_shipping_price": null,
      //                         "purchasing_disabled": false,
      //                         "purchasing_disabled_message": "",
      //                         "image_url": "",
      //                         "cost_price": 0,
      //                         "upc": "",
      //                         "mpn": "",
      //                         "gtin": "",
      //                         "inventory_level": 0,
      //                         "inventory_warning_level": 0,
      //                         "bin_picking_number": "",
      //                         "option_values": [
      //                             {
      //                                 "id": 11294650,
      //                                 "label": "24 X Can 473 ml",
      //                                 "option_id": 2960653,
      //                                 "option_display_name": "Beer"
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         "id": 13879111,
      //                         "product_id": 2979965,
      //                         "sku": "3142042_2410",
      //                         "sku_id": 10917092,
      //                         "price": 36.25,
      //                         "calculated_price": 36.25,
      //                         "sale_price": 36.25,
      //                         "retail_price": null,
      //                         "map_price": null,
      //                         "weight": null,
      //                         "calculated_weight": 1,
      //                         "width": null,
      //                         "height": null,
      //                         "depth": null,
      //                         "is_free_shipping": false,
      //                         "fixed_cost_shipping_price": null,
      //                         "purchasing_disabled": false,
      //                         "purchasing_disabled_message": "",
      //                         "image_url": "",
      //                         "cost_price": 0,
      //                         "upc": "",
      //                         "mpn": "",
      //                         "gtin": "",
      //                         "inventory_level": 0,
      //                         "inventory_warning_level": 0,
      //                         "bin_picking_number": "",
      //                         "option_values": [
      //                             {
      //                                 "id": 11294651,
      //                                 "label": "12 X Can 473 ml",
      //                                 "option_id": 2960653,
      //                                 "option_display_name": "Beer"
      //                             }
      //                         ]
      //                     }
      //                 ],
      //                 "custom_fields": [
      //                     {
      //                         "id": 36459732,
      //                         "name": "ABV",
      //                         "value": "5.00"
      //                     },
      //                     {
      //                         "id": 36459733,
      //                         "name": "Country",
      //                         "value": "CA"
      //                     },
      //                     {
      //                         "id": 36459734,
      //                         "name": "Category",
      //                         "value": "Ontario Craft"
      //                     },
      //                     {
      //                         "id": 36459735,
      //                         "name": "Type",
      //                         "value": "Lager"
      //                     },
      //                     {
      //                         "id": 36459736,
      //                         "name": "Beverage_type",
      //                         "value": "Beer"
      //                     },
      //                     {
      //                         "id": 36459737,
      //                         "name": "Producer",
      //                         "value": "ACE BEVERAGE GROUP INC."
      //                     },
      //                     {
      //                         "id": 36459738,
      //                         "name": "Beer_styles",
      //                         "value": "Amber"
      //                     },
      //                     {
      //                         "id": 36459739,
      //                         "name": "Price_Metadata_3142004",
      //                         "value": "{\"current_price\":{\"deposit\":0.10,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":0.37}],\"total_price\":3.35},\"previous_price\":{\"deposit\":0.10,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":0.00}],\"total_price\":0.00},\"on_sale\":\"N\"}"
      //                     },
      //                     {
      //                         "id": 36459740,
      //                         "name": "Price_Metadata_3142028",
      //                         "value": "{\"current_price\":{\"deposit\":50.00,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":17.91}],\"total_price\":205.65},\"previous_price\":{\"deposit\":50.00,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":0.00}],\"total_price\":0.00},\"on_sale\":\"N\"}"
      //                     },
      //                     {
      //                         "id": 36459741,
      //                         "name": "Price_Metadata_3142038",
      //                         "value": "{\"current_price\":{\"deposit\":0.60,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":2.06}],\"total_price\":18.50},\"previous_price\":{\"deposit\":0.60,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":0.00}],\"total_price\":0.00},\"on_sale\":\"N\"}"
      //                     },
      //                     {
      //                         "id": 36459742,
      //                         "name": "Price_Metadata_3142041",
      //                         "value": "{\"current_price\":{\"deposit\":2.40,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":7.77}],\"total_price\":69.95},\"previous_price\":{\"deposit\":2.40,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":0.00}],\"total_price\":0.00},\"on_sale\":\"N\"}"
      //                     },
      //                     {
      //                         "id": 36459743,
      //                         "name": "Price_Metadata_3142042",
      //                         "value": "{\"current_price\":{\"deposit\":1.20,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":4.03}],\"total_price\":36.25},\"previous_price\":{\"deposit\":1.20,\"tax\":[{\"tax_type\":\"HST\",\"tax_amount\":0.00}],\"total_price\":0.00},\"on_sale\":\"N\"}"
      //                     },
      //                     {
      //                         "id": 36459744,
      //                         "name": "product_image_1",
      //                         "value": "https://cdn.brandfolder.io/DRTYD0A2/as/rpjnhh8wc4svstf2hc6gm38/1712.png?position=1"
      //                     },
      //                     {
      //                         "id": 36459745,
      //                         "name": "product_image_2",
      //                         "value": "https://cdn.brandfolder.io/DRTYD0A2/as/rpjnhh8wc4svstf2hc6gm38/1712.png?position=2"
      //                     },
      //                     {
      //                         "id": 36459746,
      //                         "name": "container_type ",
      //                         "value": "C,K"
      //                     },
      //                     {
      //                         "id": 36459747,
      //                         "name": "pack",
      //                         "value": "1,6,24,12"
      //                     }
      //                 ],
      //                 "options": [
      //                     {
      //                         "id": 2960653,
      //                         "product_id": 2979965,
      //                         "name": "Beer1648116620-2979965",
      //                         "display_name": "Beer",
      //                         "type": "rectangles",
      //                         "sort_order": 0,
      //                         "option_values": [
      //                             {
      //                                 "id": 11294647,
      //                                 "label": "1 X Can 473 ml",
      //                                 "sort_order": 0,
      //                                 "value_data": null,
      //                                 "is_default": false
      //                             },
      //                             {
      //                                 "id": 11294648,
      //                                 "label": "1 X Keg 30000 ml",
      //                                 "sort_order": 0,
      //                                 "value_data": null,
      //                                 "is_default": false
      //                             },
      //                             {
      //                                 "id": 11294649,
      //                                 "label": "6 X Can 473 ml",
      //                                 "sort_order": 0,
      //                                 "value_data": null,
      //                                 "is_default": false
      //                             },
      //                             {
      //                                 "id": 11294650,
      //                                 "label": "24 X Can 473 ml",
      //                                 "sort_order": 0,
      //                                 "value_data": null,
      //                                 "is_default": false
      //                             },
      //                             {
      //                                 "id": 11294651,
      //                                 "label": "12 X Can 473 ml",
      //                                 "sort_order": 0,
      //                                 "value_data": null,
      //                                 "is_default": false
      //                             }
      //                         ],
      //                         "config": []
      //                     }
      //                 ]
      //             },
      //             "meta": {}
      //         }
      //     }
      // ],
      // orderDetails: {
      //     "id": 7755,
      //     "customer_id": 19448,
      //     "date_created": "Fri, 03 Jun 2022 06:47:00 +0000",
      //     "date_modified": "Fri, 03 Jun 2022 06:47:00 +0000",
      //     "date_shipped": "",
      //     "status_id": 11,
      //     "status": "Awaiting Fulfillment",
      //     "subtotal_ex_tax": "60.3000",
      //     "subtotal_inc_tax": "60.3000",
      //     "subtotal_tax": "0.0000",
      //     "base_shipping_cost": "0.0000",
      //     "shipping_cost_ex_tax": "0.0000",
      //     "shipping_cost_inc_tax": "0.0000",
      //     "shipping_cost_tax": "0.0000",
      //     "shipping_cost_tax_class_id": 2,
      //     "base_handling_cost": "0.0000",
      //     "handling_cost_ex_tax": "0.0000",
      //     "handling_cost_inc_tax": "0.0000",
      //     "handling_cost_tax": "0.0000",
      //     "handling_cost_tax_class_id": 2,
      //     "base_wrapping_cost": "0.0000",
      //     "wrapping_cost_ex_tax": "0.0000",
      //     "wrapping_cost_inc_tax": "0.0000",
      //     "wrapping_cost_tax": "0.0000",
      //     "wrapping_cost_tax_class_id": 3,
      //     "total_ex_tax": "54.7500",
      //     "total_inc_tax": "54.7500",
      //     "total_tax": "0.0000",
      //     "items_total": 18,
      //     "items_shipped": 0,
      //     "payment_method": "Credit Card",
      //     "payment_provider_id": null,
      //     "payment_status": "",
      //     "refunded_amount": "0.0000",
      //     "order_is_digital": false,
      //     "store_credit_amount": "0.0000",
      //     "gift_certificate_amount": "0.0000",
      //     "ip_address": "10.128.2.173",
      //     "ip_address_v6": "",
      //     "geoip_country": "",
      //     "geoip_country_iso2": "",
      //     "currency_id": 1,
      //     "currency_code": "CAD",
      //     "currency_exchange_rate": "1.0000000000",
      //     "default_currency_id": 1,
      //     "default_currency_code": "CAD",
      //     "staff_notes": "[{\"variant_id\":13879107,\"packup_discount\":\"5.55\"}]",
      //     "customer_message": "",
      //     "discount_amount": "5.5500",
      //     "coupon_discount": "0.0000",
      //     "shipping_address_count": 1,
      //     "is_deleted": false,
      //     "ebay_order_id": "0",
      //     "cart_id": "a6e9cb6c-1c42-4ce7-b104-9acac10e27dc",
      //     "billing_address": {
      //         "first_name": "Test",
      //         "last_name": "User",
      //         "company": "",
      //         "street_1": "Jalandher Rd",
      //         "street_2": "",
      //         "city": "Punjab",
      //         "state": "",
      //         "zip": "A1A6H3",
      //         "country": "Canada",
      //         "country_iso2": "CA",
      //         "phone": "+1(960) 886-1499",
      //         "email": "Test29@gmail.com",
      //         "form_fields": [
      //             {
      //                 "name": "Other Info",
      //                 "value": "{\"store_id\":2410,\"current_store_name\":\"QUEEN/RIVER\",\"current_store_address\":\"28 River St., M5A 3N9\",\"current_store_distance\":\"11382\",\"order_type\":\"pickup\",\"pick_delivery_date\":1654214400000,\"pick_delivery_time\":\"10:30 AM - 11:00 AM\",\"delivery_address\":\"\",\"order_email\":\"Test29@gmail.com\",\"order_payment_method\":\"card\",\"pick_delivery_date_text\":\"2022-06-03\",\"user_promotions\":\"\",\"salutation\":\"Mr\",\"contact_first_name\":\"Test\",\"contact_last_name\":\"User\",\"contact_phone\":\"+1(960) 886-1499\",\"contact_email\":\"Test29@gmail.com\",\"dob\":\"11-11-1999\",\"delivery_first_name\":\"\",\"delivery_last_name\":\"\",\"delivery_phone\":\"\",\"source\":\"app\",\"pickup_type\":\"pickup\",\"checkout_id\":\"a6e9cb6c-1c42-4ce7-b104-9acac10e27dc\"}"
      //             }
      //         ]
      //     },
      //     "is_email_opt_in": false,
      //     "credit_card_type": null,
      //     "order_source": "checkout_api",
      //     "channel_id": 1,
      //     "external_source": null,
      //     "products": {
      //         "url": "https://api.bigcommerce.com/stores/hivvn7uruo/v2/orders/7755/products",
      //         "resource": "/orders/7755/products"
      //     },
      //     "shipping_addresses": {
      //         "url": "https://api.bigcommerce.com/stores/hivvn7uruo/v2/orders/7755/shipping_addresses",
      //         "resource": "/orders/7755/shipping_addresses"
      //     },
      //     "coupons": {
      //         "url": "https://api.bigcommerce.com/stores/hivvn7uruo/v2/orders/7755/coupons",
      //         "resource": "/orders/7755/coupons"
      //     },
      //     "external_id": null,
      //     "external_merchant_id": null,
      //     "tax_provider_id": "",
      //     "customer_locale": "en",
      //     "store_default_currency_code": "CAD",
      //     "store_default_to_transactional_exchange_rate": "1.0000000000",
      //     "custom_status": "Awaiting Fulfillment"
      // },
      // transactionDetails: {
      //     "id": 10004043,
      //     "authorizing_merchant_id": 117682587,
      //     "approved": 1,
      //     "message_id": 62,
      //     "message": "Approved",
      //     "auth_code": "946344 ",
      //     "created": "2022-06-03T13:46:54.3371338+00:00",
      //     "amount": 54.75,
      //     "order_number": "6c-1c42-4ce7-b104-9acac10e27dc",
      //     "type": "PA",
      //     "comments": "",
      //     "batch_number": "0001",
      //     "total_refunds": 0.0,
      //     "total_completions": 0.0,
      //     "payment_method": "CC",
      //     "card": {
      //         "name": "Gh",
      //         "expiry_month": "11",
      //         "expiry_year": "23",
      //         "card_type": "VI",
      //         "last_four": "4675",
      //         "avs_result": "",
      //         "cvd_result": "1",
      //         "cavv_result": "2"
      //     },
      //     "billing": {
      //         "name": "",
      //         "address_line1": "",
      //         "address_line2": "",
      //         "city": "",
      //         "province": "",
      //         "country": "",
      //         "postal_code": "",
      //         "phone_number": "",
      //         "email_address": ""
      //     },
      //     "shipping": {
      //         "name": "",
      //         "address_line1": "",
      //         "address_line2": "",
      //         "city": "",
      //         "province": "",
      //         "country": "",
      //         "postal_code": "",
      //         "phone_number": "",
      //         "email_address": ""
      //     },
      //     "custom": {
      //         "ref1": "",
      //         "ref2": "",
      //         "ref3": "",
      //         "ref4": "",
      //         "ref5": ""
      //     },
      //     "adjusted_by": [],
      //     "links": [
      //         {
      //             "rel": "complete",
      //             "href": "https://api.na.bambora.com/v1/payments/10004043/completions",
      //             "method": "POST"
      //         }
      //     ]
      // }
      // }
      // const { products, orderDetails, transactionDetails } = serverOrder;
      // const orderDetails = await lastValueFrom(this.httpService
      //   .get(
      //     `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
      //     }/v2/orders/${serverOrder.orderId}`,
      //     {
      //       headers: {
      //         'x-auth-token': this.configService.get('bigcom').access_token,
      //       },
      //     },
      //   ).pipe(
      //     map((response) => response.data),
      //     catchError((err) => {
      //       const message = err.message;
      //       throw new UnprocessableEntityException(message);
      //     }),
      //   )
      // );

      // const productDetailsArr = await lastValueFrom(this.httpService
      //   .get(orderDetails.products.url,
      //     {
      //       headers: {
      //         'x-auth-token': this.configService.get('bigcom').access_token,
      //       },
      //     },
      //   ).pipe(
      //     map((response) => response.data),
      //     catchError((err) => {
      //       const message = err.message;
      //       throw new UnprocessableEntityException(message);
      //     }),
      //   )
      // );

      // const transactionDetails = (serverOrder.transactionId) ? await this.bamboraService.getPaymentInfoByTranasctionId(serverOrder.transactionId) : "";

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
        name: `${orderDetails.billing_address.first_name} ${orderDetails.billing_address.last_name}`,
        email: orderDetails.billing_address.email,
        postalCode: orderDetails.billing_address.zip,
        dob: billingAddressFormFields.dob,
        salutation: billingAddressFormFields.salutation,
        customerType: CustomerTypeEnum.Email,
        ccType: transactionDetails?.card?.card_type || null,
        cardNumber: +transactionDetails?.card?.last_four || null,
        cardAmount: +transactionDetails?.amount || 0,
      }

      let singleUnits = 0;
      let twoSixUnits = 0;
      let eightEighteenUnits = 0;
      let twentyFourPlusUnits = 0;
      let volumeTotalHL = 0;

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
      const orderDate = orderDetails.date_created;
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
        transactionId: billingAddressFormFields.transactionId || null,
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

      console.log('orderCompleteDetails', {
          ...serverOrderParsed,
          serverOrderCustomerDetails: customerDetails,
          serverOrderDeliveryDetails: deliveryDetails,
          serverOrderProductDetails: productsArr,
        });
      await this.serverOrderRepository.save(this.serverOrderRepository.create({
        ...serverOrderParsed,
        serverOrderCustomerDetails: customerDetails,
        serverOrderDeliveryDetails: deliveryDetails,
        serverOrderProductDetails: productsArr,
      }));

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
    serverOrder: UpdateOrderDto,
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
      
      console.log('decrease', serverOrder?.serverOrderProductDetails);

      if(serverOrder?.serverOrderProductDetails){
        createOrderDto.products.forEach((product, _idx) => {
          const updatedProduct = serverOrder.serverOrderProductDetails.find(prod => product.sku === prod.itemSKU);
          if(updatedProduct?.id){
            serverOrder.serverOrderProductDetails[_idx].quantity =  updatedProduct.quantity;
          }
        })
      }

      await this.ordersService.updateOrder(`${id}`, createOrderDto);
      const orderToSave = await this.serverOrderRepository.preload(serverOrder);
      const response = await Promise.all([
        this.serverOrderRepository.save(orderToSave),
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
         const test =  await this.bamboraService.UpdatePaymentStatus(transactionId, {
            amount: 0,
          });
        }
      } else if (orderType === 'delivery') {
        await this.cancelBeerGuyOrder(`${id}`, cancellationReason);
      }
      const resp = await Promise.all([this.ordersService.updateOrder(`${id}`, {
        status_id: +orderStatus,
      }),
      this.serverOrderDetail(id),
      ]);

      const serverOrder = resp[1];
      serverOrder.orderStatus = +orderStatus;
      serverOrder.cancellationBy = cancellationBy;
      serverOrder.cancellationDate = cancellationDate;
      serverOrder.cancellationReason = cancellationReason;
      serverOrder.cancellationNote = cancellationNote || ''; 
      const orderToSave = await this.serverOrderRepository.preload(serverOrder);

      const response = await Promise.all([
        this.serverOrderRepository.save(orderToSave),
        this.orderHistoryService.create({
          orderId: `${id}`,
          orderStatus: +orderStatus,
          name: cancellationBy,
          identifier: cancellationBy.toLowerCase() === 'customer' ? '' : identifier ,
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
      
      if(prevOrder?.serverOrderProductDetails){
        createOrderDto.products.forEach((product, _idx) => {
          const updatedProduct = prevOrder.serverOrderProductDetails.find(prod => product.sku === prod.itemSKU);
          if(updatedProduct?.id){
            prevOrder.serverOrderProductDetails[_idx].quantity =  updatedProduct.quantity;
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
        packUnits_24Plus: serverOrder.packUnits_24Plus
      }

      if(+serverOrder.orderStatus === 5){
        //cancelled
        console.log('cancelled', serverOrder.orderStatus);
        prevOrder = {
          ...prevOrder,
          cancellationDate: serverOrder.cancellationDate,
          cancellationBy : serverOrder.cancellationBy,
          cancellationReason: serverOrder.cancellationReason,
          cancellationNote: serverOrder.cancellationNote,
          // completedDateTime: serverOrder?.completedDateTime || '',
          completedDateTime: moment().toDate(),
          underInfluence: customerProof.underInfluence === 1, 
          dobBefore: customerProof.dobBefore === 1, 
        }
      } else if(+serverOrder.orderStatus === 10){
        //completed
        console.log('completed', serverOrder.orderStatus);
        prevOrder = {
          ...prevOrder,
          underInfluence: false, 
          dobBefore: false, 
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