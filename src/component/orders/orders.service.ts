import {
  BadGatewayException,
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { ApiType, ApiVersion } from '@beerstore/core/interfaces/urls';
import {
  createQuery,
  // getBigCommUrl,
  handleError,
  serviceHeader,
} from '@beerstore/core/utils';
import * as moment from 'moment';
import { CreateOrderDto } from './dto';
import { Order, OrderQuery } from '@beerstore/core/interfaces';
import { ServerOrderService } from '../serverOrder/server-order.service';
@Injectable()
export class OrdersService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(forwardRef(() => ServerOrderService))
    private serverOrderService: ServerOrderService,
  ) { }

  async getOrder(orderId: string): Promise<any> {
    const uri = `v2/orders`;
    const order = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
          }/${uri}/${orderId}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError(handleError<any>(null)),
        ),
    );
    return order;
  }

  async getOrderProducts(orderId: string): Promise<any> {
    const uri = `v2/orders`;
    const orderProducts = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
          }/${uri}/${orderId}/products`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            throw new BadGatewayException(err);
          }),
        ),
    );
    return orderProducts;
  }

  async getShippingAddresses(orderId: string): Promise<any> {
    const uri = `v2/orders`;
    const addresses = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
          }/${uri}/${orderId}/shipping_addresses`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError(handleError<any>(null)),
        ),
    );
    return addresses;
  }

  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const allReq = [
        this.getOrder(orderId),
        this.getOrderProducts(orderId),
        this.getShippingAddresses(orderId),
      ];
      const resp = await Promise.all(allReq);
      // console.log('resp', resp);
      return {
        order: resp[0] || [],
        orderProducts: resp[1] || [],
        orderAddresses: resp[2] || [],
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  updateOrder(orderId: string, createOrderDto: CreateOrderDto): Promise<any> {
    const uri = `v2/orders`;
    const response = lastValueFrom(
      this.httpService
        .put(
          `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
          }/${uri}/${orderId}`,
          createOrderDto,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError(handleError<any>(null)),
        ),
    );
    return response;
  }

  getAllOrders(query: OrderQuery): Observable<Order[]> {
    const encodedUri = createQuery(query);
    const uri = `v2/orders`;
    const url = `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
      }/${uri}?${encodedUri}`;
    return this.httpService
      .get(url, {
        headers: {
          'x-auth-token': this.configService.get('bigcom').access_token,
        },
      })
      .pipe(
        map((response) => response.data),
        catchError(handleError<any>(null)),
      );
  }

  async fetchReportOrders(
    status_id: number,
    min_id: number,
    max_id: number,
    limit: number,
  ): Promise<any> {
    let filter = ``;
    const uri = `v2/orders`;
    const orders = [];
    let flag = true;
    let page = 1;

    if (status_id) {
      filter = `${filter}&status_id=${status_id}`;
    }
    if (min_id) {
      filter = `${filter}&min_id=${min_id}`;
    }
    if (max_id) {
      filter = `${filter}&max_id=${max_id}`;
    }
    if (limit) {
      filter = `${filter}&limit=${limit}`;
    }
    while (flag == true) {
      const limitedOrders = await lastValueFrom(
        this.httpService
          .get(
            `${this.configService.get('bigcom').url}/stores/${this.configService.get('bigcom').store
            }/${uri}?page=${page}&${filter}`,
            {
              headers: {
                'x-auth-token': this.configService.get('bigcom').access_token,
              },
            },
          )
          .pipe(
            map((response) => {
              if (response.data && response.data.length) {
                page += 1;
                return response.data;
              } else {
                flag = false;
                return orders;
              }
            }),
            catchError((err) => {
              throw new BadGatewayException(err.message);
            }),
          ),
      );
      limitedOrders.map((o) => {
        orders.push(o);
      });
    }
    // console.log(orders.length);
    return orders;
  }

  // getAllOrders(query: OrderQuery): Observable<Order[]> {
  //   const encodedUri = createQuery(query);
  //   console.log('request', encodedUri);
  //   const url = `${getBigCommUrl(
  //     ApiVersion.V2,
  //     ApiType.Orders,
  //     `?${encodedUri}`,
  //   )}`;
  //   return this.httpService.get(url, serviceHeader()).pipe(
  //     map((response) => response.data),
  //     catchError(handleError<any>(null)),
  //   );
  // }

  async getAllOrdersReports(
    reportType: number,
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
    vector: string,
    brewer: string
  ): Promise<any> {
    return this.serverOrderService.getAllServerOrderWithRelationData(
      reportType,
      status_id,
      store_id,
      min_date_created,
      max_date_created,
      vector,
      brewer
    );
  }

  async getOrderProductsReports(url: string): Promise<any> {
    console.log('testing', url, this.configService.get('bigcom').access_token);
    return await lastValueFrom(
      this.httpService
        .get(url, {
          headers: {
            'x-auth-token': this.configService.get('bigcom').access_token,
          },
        })
        .pipe(
          map((res) => {
            if (res.data && res.data.length) {
              let productData = res.data;
              let i = 1;
              productData = productData.map((productObj) => {
                productObj.line_item = i;
                i += 1;

                const productInfo =
                  productObj.product_options[0].display_value.split('X');
                const product = productInfo[1].trim().split(' ');
                productObj.packSize = productInfo[0].trim() || '';
                // productObj.volume = product[1] + product[2] || '',
                productObj.volume = product[1] || '';
                productObj.container = product[0] || '';
                productObj.itemtotal = productObj.total_inc_tax;
                return productObj;
              });
              Object.assign(res?.data, { productData });
              return res.data;
            }
            return;
          }),
        ),
    );
  }
}
