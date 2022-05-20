import { orderQuery } from '@beerstore/core/interfaces';
import { validateQueryParams } from '@beerstore/core/utils';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateOrderDto } from './dto';
import { OrdersService } from './orders.service';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';

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
    // const order = await this.ordersService.getOrder(orderId);
    // return order;
    const orderDetails = await this.ordersService.getOrderDetails(orderId);
    return orderDetails;
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

  @ApiQuery({
    name: 'status_id',
    description:
      ' 1 => "Pending", 2 => "In Transit (shipped)", 3 => "In Transit (Partially Shipped)", 4 => "Refunded", 5 => "Cancelled", 6 => "Returned (Declined)", 7 => "Awaiting Payment", 8 => "Awaiting Pickup", 9 => "Awaiting Delivery (Awaiting Shipment)", 10 => "Completed", 11 => "Awaiting Fulfillment", 12 => "Manual Verification Required", 13 => "Disputed", 14 => "Partially Refunded"',
    required: false,
  })
  @ApiQuery({
    name: 'store_id',
    description: 'store id of store i.e. 12321',
    required: false,
  })
  @ApiQuery({
    name: 'min_date_created',
    required: false,
    description: 'Minimum date the order was created i.e. 2021-04-20',
  })
  @ApiQuery({
    name: 'max_date_created',
    required: false,
    description: 'Maximum date the order was created i.e. 2022-04-20',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/report/getAllOrders')
  async getAllOrders(
    @Query('status_id') status_id: number,
    @Query('store_id') store_id: number,
    @Query('min_date_created') min_date_created: Date,
    @Query('max_date_created') max_date_created: Date,
  ) {
    return this.ordersService.getAllOrdersReports(
      status_id,
      store_id,
      min_date_created,
      max_date_created,
    );
  }
}
