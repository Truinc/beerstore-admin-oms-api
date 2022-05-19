import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { ApiType, ApiVersion } from '@beerstore/core/interfaces/urls';
import {
  createQuery,
  getBigCommUrl,
  handleError,
  serviceHeader,
} from '@beerstore/core/utils';
import * as moment from 'moment';
import { CreateOrderDto } from './dto';
import { Order, OrderQuery } from '@beerstore/core/interfaces';
@Injectable()
export class OrdersService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

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

  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const allReq = [
        this.getOrder(orderId),
        this.getOrderProducts(orderId),
        this.getShippingAddresses(orderId),
      ];
      const resp = await Promise.all(allReq);
      return {
        order: resp[0] || [],
        orderProducts: resp[1] || [],
        orderAddresses: resp[2] || [],
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
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

  async getAllOrdersReports(
    status_id: number,
    store_id: number,
    min_date_created: Date,
    max_date_created: Date,
  ): Promise<any> {
    let filter = ``;
    const uri = `v2/orders`;
    const orders = [];
    let flag = true;
    let page = 1;

    if (status_id) {
      filter = `${filter}&status_id=${status_id}`;
    }
    if (min_date_created) {
      filter = `${filter}&min_date_created=${moment(min_date_created).format(
        'YYYY-MM-DD',
      )}`;
    }
    if (max_date_created) {
      filter = `${filter}&max_date_created=${moment(max_date_created).format(
        'YYYY-MM-DD',
      )}`;
    }

    while (flag == true) {
      let limitedOrders = await lastValueFrom(
        this.httpService
          .get(
            `${this.configService.get('bigcom').url}/stores/${
              this.configService.get('bigcom').store
            }/${uri}?limit=250&page=${page}&${filter}`,
            {
              headers: {
                'x-auth-token': this.configService.get('bigcom').access_token,
              },
            },
          )
          .pipe(
            map(async (response) => {
              if (response.data && response.data.length) {
                page += 1;
                let data = response.data;
                data = data.map(async (obj) => {
                  obj.order_vector = 'BigCommerce';

                  [
                    obj.volumeTotal,
                    obj.singleUnits,
                    obj.twoSixUnits,
                    obj.eightEighteenUnits,
                    obj.twentyFourPlusUnits,
                    obj.tip,
                    obj.deliverId,
                  ] = Array(7).fill(0);

                  [
                    obj.storeNumber,
                    obj.orderType,
                    obj.transactionAmount,
                    obj.openDateTime,
                    obj.pickupReadyDateTime,
                    obj.partialOrder,
                    obj.completedByEmpId,
                    obj.completedDateTime,
                    obj.idChecked,
                    obj.cancelledByEmpId,
                    obj.cancelledDateTime,
                    obj.cancelReason,
                    obj.cancelledByCustomer,
                    obj.cancelledByDriver,
                    obj.requestedPickuptime,
                    obj.ccType,
                    obj.ccLastFourNumber,
                    obj.customerType,
                    obj.browserVersion,
                    obj.deliveryType,
                    obj.deliveryEta,
                    obj.deliveryScheduledDateTime,
                    obj.refunded,
                    obj.refundReason,
                    obj.deliverName,
                    obj.deliveredDate,
                    obj.deliveryAddress,
                    obj.deliveryCity,
                    obj.pickUpType,
                    obj.customerDob,
                    obj.customerSalutation,
                  ] = Array(31).fill('');

                  if (obj.billing_address.form_fields[0]) {
                    const value = JSON.parse(
                      obj.billing_address.form_fields[0]?.value,
                    );
                    obj.storeNumber = value.store_id;
                    obj.orderType = value.order_type;
                    obj.customerDob = value.dob;
                    obj.customerSalutation = value.salutation;
                  }

                  obj.submittedDateTime = moment
                    .utc(new Date(obj.date_created))
                    .format('YYYY-MM-DD hh:mmA');

                  obj.submittedDate = moment
                    .utc(new Date(obj.date_created))
                    .format('YYYY-MM-DD');

                  obj.productTotal = obj.total_ex_tax;

                  obj.deliveryFee = obj.shipping_cost_ex_tax;

                  obj.deliveryFeeHst = obj.shipping_cost_tax;

                  obj.grandTotal =
                    parseFloat(obj.product_total) +
                    parseFloat(obj.deliveryFee) +
                    parseFloat(obj.deliveryFeeHst);

                  obj.customerName = obj.billing_address.first_name.concat(
                    obj.billing_address.last_name,
                  );
                  obj.customerEmail = obj.billing_address.email;
                  obj.postalCode = obj.billing_address.zip;
                  obj.deliveryAddress = `${obj.billing_address.street_1},${
                    obj.billing_address.street_2
                  }${obj.billing_address.street_2 ? ',' : ''}${
                    obj.billing_address.city
                  }${obj.billing_address.city ? ',' : ''}${
                    obj.billing_address.state
                  }${obj.billing_address.state ? ',' : ''}${
                    obj.billing_address.zip
                  }`;
                  obj.deliveryCity = obj.billing_address.city;
                  obj.deliveryPostalCode = obj.billing_address.zip;
                  obj.productsArray = await this.getOrderProductsReports(
                    obj.products.url,
                  );
                  obj.productsArray.filter((o) => {
                    if (o.packSize == 1) {
                      obj.singleUnits += o.quantity;
                    } else if (o.packSize >= 2 && o.packSize <= 6) {
                      obj.twoSixUnits += o.quantity;
                    } else if (o.packSize >= 8 && o.packSize <= 18) {
                      obj.eightEighteenUnits += o.quantity;
                    } else if (o.packSize >= 24) {
                      obj.twentyFourPlusUnits += o.quantity;
                    }
                    return;
                  });
                  return obj;
                });
                await Promise.all(data);
                Object.assign(response?.data, { data });
                return response.data;
              } else {
                flag = false;
                return;
              }
            }),
            catchError((err) => {
              throw new BadGatewayException(err.message);
            }),
          ),
      );
      if (store_id) {
        limitedOrders = limitedOrders.filter((e) => {
          const value = JSON.parse(e.billing_address.form_fields[0].value);
          if (value.store_id == store_id) {
            return e;
          }
        });
      }
      if (limitedOrders) {
        limitedOrders.map((order) => {
          orders.push(order);
        });
      }
    }
    // console.log(orders.length);
    return orders;
  }

  async getOrderProductsReports(url: string): Promise<any> {
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
