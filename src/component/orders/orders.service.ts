import { BadGatewayException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map, Observable } from 'rxjs';
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

  getOrder(orderId: string): Observable<Order> {
    const queryStr = `/${orderId}`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    return this.httpService.get(url, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
  }

  getOrderProducts(orderId: string): Observable<Order> {
    const queryStr = `/${orderId}/products`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    return this.httpService.get(url, serviceHeader()).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw new BadGatewayException(err);
      }),
    );
  }

  getShippingAddresses(orderId: string): Observable<Order> {
    const queryStr = `/${orderId}/shipping_addresses`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    return this.httpService.get(url, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
  }

  createOrder(createOrderDto: CreateOrderDto): Observable<Order> {
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, '')}`;
    return this.httpService.post(url, createOrderDto, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
  }

  updateOrder(
    orderId: string,
    createOrderDto: CreateOrderDto,
  ): Observable<Order> {
    const queryStr = `/${orderId}`;
    const url = `${getBigCommUrl(ApiVersion.V2, ApiType.Orders, queryStr)}`;
    return this.httpService.put(url, createOrderDto, serviceHeader()).pipe(
      map((response) => response.data),
      catchError(handleError<any>(null)),
    );
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
