import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { ApiType, ApiVersion } from '@beerstore/core/interfaces/urls';
import {
  createQuery,
  getBigCommUrl,
  handleError,
  serviceHeader,
} from '@beerstore/core/utils';
import { CreateOrderDto } from './dto';
import { Order, OrderQuery } from '@beerstore/core/interfaces';
@Injectable()
export class OrdersService {
  constructor(private httpService: HttpService) {}

  async getOrder(orderId: string): Promise<any> {
    const queryStr = `/${orderId}`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    const order = await lastValueFrom(
      this.httpService.get(url, serviceHeader()).pipe(
        map((response) => response.data),
        catchError(handleError<any>(null)),
      ),
    );
    return order;
  }

  async getOrderProducts(orderId: string): Promise<any> {
    const queryStr = `/${orderId}/products`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    const orderProducts = await lastValueFrom(
      this.httpService.get(url, serviceHeader()).pipe(
        map((response) => response.data),
        catchError((err) => {
          throw new BadGatewayException(err);
        }),
      ),
    );
    return orderProducts;
  }

  async getShippingAddresses(orderId: string): Promise<any> {
    const queryStr = `/${orderId}/shipping_addresses`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    const addresses = await lastValueFrom(
      this.httpService.get(url, serviceHeader()).pipe(
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
      console.log('resp', resp);
      return {
        order: resp[0] || [],
        orderProducts: resp[1] || [],
        orderAddresses: resp[2] || [],
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  createOrder(createOrderDto: CreateOrderDto): Observable<Order> {
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, '')}`;
    return this.httpService.post(url, createOrderDto, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
  }

  updateOrder(orderId: string, createOrderDto: CreateOrderDto): Promise<any> {
    const queryStr = `/${orderId}`;
    console.log('incoming request', createOrderDto);
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    const response = lastValueFrom(
      this.httpService.put(url, createOrderDto, serviceHeader()).pipe(
        map((response) => response.data),
        catchError(handleError<any>(null)),
      ),
    );
    return response;
  }

  deleteOrder(orderId: string): Observable<Order> {
    const queryStr = `/${orderId}`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    return this.httpService.delete(url, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
  }

  getAllOrders(query: OrderQuery): Observable<Order[]> {
    const encodedUri = createQuery(query);
    console.log('request', encodedUri);
    const url = `${getBigCommUrl(
      ApiVersion.V2,
      ApiType.Orders,
      `?${encodedUri}`,
    )}`;
    return this.httpService.get(url, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
  }
}
