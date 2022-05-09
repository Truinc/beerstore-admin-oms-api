import { orderQuery } from '@beerstore/core/interfaces';
import { validateQueryParams } from '@beerstore/core/utils';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto';
import { OrdersService } from './orders.service';

// customer id should be 0 in case of guest order
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get(':orderId/products')
  async getOrderProducts(@Param('orderId') orderId) {
    try {
      const order = await this.ordersService.getOrderProducts(orderId);
      console.log('order', order);
      return order;
    } catch (error) {
      console.log('error12345', error);
      return 'order not found';
    }
  }

  @Get('/:orderId/shipping_addresses')
  async getShippingAddresses(@Param('orderId') orderId) {
    const response = await this.ordersService.getShippingAddresses(orderId);
    return response;
  }

  @Get(':orderId')
  async getOrder(@Param('orderId') orderId) {
    try {
      const order = await this.ordersService.getOrder(orderId);
      console.log('order', order);
      return order;
    } catch (error) {
      console.log('error12345', error);
      return 'order not found';
    }
  }

  @Get('/')
  async getAllOrder(@Query() query) {
    try {
      console.log('vallll', Object.keys(query));
      if (!validateQueryParams(orderQuery, Object.keys(query))) {
        console.log('invalid query params');
        return 'invalid request';
      }
      const orders = await this.ordersService.getAllOrders(query);
      console.log('orders', orders);
      return orders;
    } catch (error) {
      console.log('error12345', error);
      return 'orders not found';
    }
  }

  @Post('/')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    const response = await this.ordersService.createOrder(createOrderDto);
    return response;
  }

  /**
   *  updates order including status of the order
   * @param orderId
   * @returns
   */
  @Put('/:orderId')
  async updateOrder(
    @Param('orderId') orderId,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const response = await this.ordersService.updateOrder(
      orderId,
      createOrderDto,
    );
    return response;
  }

  @Delete('/:orderId')
  async deleteOrder(@Param('orderId') orderId) {
    const response = await this.ordersService.deleteOrder(orderId);
    return response;
  }
}
