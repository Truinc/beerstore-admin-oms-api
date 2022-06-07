import {
  Controller,
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
    name: 'report_type',
    description: "1 => Transaction Report, 2 => Order Report",
    enum: [1,2],
    isArray: false,
    required: true,
  })
  @ApiQuery({
    name: 'min_date_created',
    required: true,
    description: 'Minimum date the order was created i.e. 2021-04-20',
  })
  @ApiQuery({
    name: 'max_date_created',
    required: true,
    description: 'Maximum date the order was created i.e. 2022-04-20',
  })
  @ApiQuery({
    name: 'vector',
    required: false,
    description: 'eg website, app, kiosk etc',
  })
  @ApiQuery({
    name: 'brewer',
    required: false,
    description: 'manufacturer of beer',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/report/getAllOrders')
  async getAllOrders(
    @Query('report_type') reportType: number,
    @Query('status_id') status_id: number,
    @Query('store_id') store_id: number,
    @Query('min_date_created') min_date_created: Date,
    @Query('max_date_created') max_date_created: Date,
    @Query('vector') vector: string,
    @Query('brewer') brewer: string,
  ) {
    return this.ordersService.getAllOrdersReports(
      reportType,
      status_id,
      store_id,
      min_date_created,
      max_date_created,
      vector,
      brewer
    );
  }
}
