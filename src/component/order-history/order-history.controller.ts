import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
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
import { OrderHistoryService } from './order-history.service';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { UpdateOrderHistoryDto } from './dto/update-order-history.dto';
import { OrderHistory } from './entities/order-history.entity';
import { ApiPaginatedResponse } from '@beerstore/core/swagger/paginated-response';
import { PaginationInputPipe } from '@beerstore/core/pipes/pagination-input.pipe';
import { PaginationInputDto } from '@beerstore/core/swagger/dto/pagination.dto';
@ApiTags('order-history')
@ApiBearerAuth()
@ApiExtraModels(OrderHistory)
@Controller('order-history')
export class OrderHistoryController {
  constructor(private readonly orderHistoryService: OrderHistoryService) {}

  @ApiBody({ type: CreateOrderHistoryDto })
  @ApiBadRequestResponse({
    description: '400. ValidationException',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createOrderHistoryDto: CreateOrderHistoryDto) {
    return this.orderHistoryService.create(createOrderHistoryDto);
  }

  @ApiQuery({ required: false, name: 'orderId', type: 'string' })
  @ApiPaginatedResponse(OrderHistory)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
    @Query('orderId') orderId: string,
  ) {
    const filter = { order: orderId };
    const { take, skip, sort } = paginationDto;
    return this.orderHistoryService.findAll(take, skip, sort, filter);
  }

  @ApiOkResponse({ description: '200. Success', type: OrderHistory })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderHistoryService.findOne(+id);
  }

  @ApiBody({ type: UpdateOrderHistoryDto })
  @ApiOkResponse({ description: '204. Success', type: OrderHistory })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderHistoryDto: UpdateOrderHistoryDto,
  ) {
    return this.orderHistoryService.update(id, updateOrderHistoryDto);
  }

  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'order not found' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderHistoryService.remove(+id);
  }
}
