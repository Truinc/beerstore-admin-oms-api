import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import { PaginationInputPipe } from '@beerstore/core/pipes/pagination-input.pipe';
import { PaginationInputDto } from '@beerstore/core/swagger/dto/pagination.dto';
import { ApiPaginatedResponse } from '@beerstore/core/swagger/paginated-response';
import { ServerOrder as Order } from './entity/server-order.entity';
import { ServerOrderService } from './server-order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('server-order')
@ApiBearerAuth()
@ApiExtraModels(Order)
@Controller('server-order')
export class ServerOrderController {
  constructor(private serverOrderService: ServerOrderService) {}

  @ApiBody({ type: CreateOrderDto })
  // @ApiOkResponse({ description: '200. Success', type: Order })
  @ApiBadRequestResponse({
    description: '400. ValidationException',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  async create(@Body() serverOrder: CreateOrderDto) {
    try {
      const order = await this.serverOrderService.addServerOrder(serverOrder);
      return order;
    } catch (error) {
      throw error;
    }
  }

  @ApiQuery({
    required: false,
    name: 'searchText',
  })
  @ApiQuery({
    required: false,
    name: 'orderStatus',
    description:
      'awaiting_fulfillment = 11,in_transit = 3, returned = 6, pickup = 8, awaiting_shipment = 9, completed = 10,cancelled = 5',
    enum: [11, 3, 6, 8, 9, 10, 5],
    isArray: false,
  })
  @ApiPaginatedResponse(Order)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
    @Query('searchText') searchText: string,
    @Query('orderStatus') orderStatus: number,
  ) {
    try {
      const filter = {
        search: searchText,
        status: orderStatus,
      };
      const { take, skip, sort } = paginationDto;
      return this.serverOrderService.findAllServerOrder(
        take,
        skip,
        sort,
        filter,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ description: '200. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const order = await this.serverOrderService.findOne(id);
    if (!order) {
      throw new NotFoundException('user not found');
    }
    return order;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('/:id')
  async updateServerOrder(
    @Param('id', ParseIntPipe) serverOrderId: number,
    @Body() serverOrder: UpdateOrderDto,
  ): Promise<Order> {
    try {
      const response = await this.serverOrderService.updateServerOrder(
        serverOrderId,
        serverOrder,
      );
      // update order on Big commerce data
      return response;
    } catch (err) {
      throw err;
    }
  }

  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'order not found' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  async deleteOrder(@Param('id', ParseIntPipe) serverOrderId: number) {
    try {
      const response = await this.serverOrderService.removeServerOrder(
        serverOrderId,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // async importMultipleOrders(
  //   @Body() serverOrders: ServerOrder[],
  // ): Promise<any> {
  //   const response = await this.serverOrderService.bulkImportServerOrder(
  //     serverOrders,
  //   );

  //   // update order on Big commerce data
  //   return response;
  // }
}
