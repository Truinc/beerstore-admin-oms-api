import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { createQuery, handleError } from '@beerstore/core/utils';
import { CreateOrderDto } from './dto';
import { Order, OrderQuery } from '@beerstore/core/interfaces';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class OrdersService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async getOrder(orderId: string): Promise<any> {
    const uri = `v2/orders`;
    const order = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
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
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
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
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
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
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
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
    const url = `${this.configService.get('bigcom').url}/stores/${
      this.configService.get('bigcom').store
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
            `${this.configService.get('bigcom').url}/stores/${
              this.configService.get('bigcom').store
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

  // createOrder(createOrderDto: CreateOrderDto): Observable<Order> {
  //   const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, '')}`;
  //   return this.httpService.post(url, createOrderDto, serviceHeader()).pipe(
  //     map((response) => response.data),
  //     catchError(handleError<any>(null)),
  //   );
  // }
}
