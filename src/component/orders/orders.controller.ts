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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateOrderDto } from './dto';
import { OrdersService } from './orders.service';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import { GetOrderDto } from './dto/getOrder.dto';

// customer id should be 0 in case of guest order
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) { }

  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } }))
  @Get('/report/getAllOrders')
  async getAllOrders(
    @Query() query: GetOrderDto
  ) {
    return this.ordersService.getAllOrdersReports(query);
  }
}
