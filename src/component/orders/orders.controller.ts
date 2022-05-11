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
    const order = await this.ordersService.getOrderProducts(orderId);
    return order;
  }

  @Get('/:orderId/shipping_addresses')
  async getShippingAddresses(@Param('orderId') orderId) {
    const response = await this.ordersService.getShippingAddresses(orderId);
    return response;
  }

  @Get(':orderId')
  async getOrder(@Param('orderId') orderId) {
    const order = await this.ordersService.getOrder(orderId);
    return order;
  }

  @Get('/')
  async getAllOrder(@Query() query) {
    if (!validateQueryParams(orderQuery, Object.keys(query))) {
      return 'invalid request';
    }
    const orders = await this.ordersService.getAllOrders(query);
    return orders;
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
