import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import JwtAccessGuard from 'src/guards/jwt-access.guard';
import { OrdersService } from './orders.service';

// customer id should be 0 in case of guest order
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}
  @ApiQuery({
    name: 'status_id',
    description: '1,2,3',
    required: false,
  })
  @ApiQuery({
    name: 'min_id',
    required: false,
    description: 'The minimum order ID',
  })
  @ApiQuery({
    name: 'max_id',
    required: false,
    description: 'The maximum order ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description:
      'Controls the number of items per page in a limited (paginated) list of products.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/orders/getAllOrders')
  async getAllOrders(
    @Query('status_id') status_id: number,
    @Query('min_id') min_id: number,
    @Query('max_id') max_id: number,
    @Query('limit') limit: number,
  ) {
    return this.ordersService.fetchReportOrders(
      status_id,
      min_id,
      max_id,
      limit,
    );
  }
}
