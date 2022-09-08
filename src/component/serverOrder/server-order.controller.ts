import {
  Body,
  Controller,
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
import { OrderEnum, ServerOrder as Order } from './entity/server-order.entity';
import { ServerOrderService } from './server-order.service';
import { CreateServerOrderDto } from './dto/create-server-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreatePostFeedDto } from './dto/create-post-feed.dto';
import { CreateCustomerProofDto } from './dto/create-customer-proof.dto';
import { CreatePaymentDetailsDto } from './dto/create-payment-details.dto';
import { UpdateCustomerProofDto } from './dto/update-customer-proof.dto';
import { CustomerProof } from './entity/customer-proof.entity';
import { PaymentDetails } from './entity/payment-details.entity';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UpdateOrderHistoryDto } from '../order-history/dto/update-order-history.dto';
import { CreateOrderHistoryDto } from '../order-history/dto/create-order-history.dto';
import { CreateOrderDto } from '../orders/dto';
import LocalAuthGuard from 'src/guards/local-auth.guard';
import ExternalGuard from '@beerstore/core/guards/external.guard';
import RolesGuard from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from '../user/entity/user.entity';
import { BeerGuyUpdateDto } from './dto/beerguy-order-update.dto';
import { RefundOrderDto } from '../orders/dto/refundOrder.dto';

@ApiTags('server-order')
@ApiBearerAuth()
@ApiExtraModels(Order)
@Controller('server-order')
export class ServerOrderController {
  constructor(private serverOrderService: ServerOrderService) {}

  @ApiBody({ type: CreateServerOrderDto })
  // @ApiOkResponse({ description: '200. Success', type: Order })
  @ApiBadRequestResponse({
    description: '400. ValidationException',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(ExternalGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  async create(@Body() serverOrder: CreateServerOrderDto) {
    const order = await this.serverOrderService.addServerOrder(serverOrder);
    return order;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.storemanager, RolesEnum.reportingadmin)
  @HttpCode(HttpStatus.OK)
  @Get('/reportStatus/:reportId')
  async getreportStatus(@Param('reportId') reportId: string) {
    return this.serverOrderService.getReportStatus(reportId);
  }

  @ApiQuery({
    required: false,
    name: 'searchText',
  })
  @ApiQuery({
    required: true,
    name: 'orderStatus',
    description:
      'awaiting_fulfillment = 11,in_transit = 3, returned = 6, pickup = 8, awaiting_shipment = 9, completed = 10,cancelled = 5',
    enum: [11, 3, 6, 8, 9, 10, 5],
    isArray: false,
  })
  @ApiQuery({
    required: true,
    name: 'searchFromDate',
    description: 'Format:- YYYY-MM-DD',
  })
  @ApiQuery({
    required: true,
    name: 'searchToDate',
    description: 'Format:- YYYY-MM-DD',
  })
  @ApiQuery({
    required: false,
    name: 'orderType',
  })
  @ApiQuery({
    required: false,
    name: 'storeId',
  })
  @ApiPaginatedResponse(Order)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
    @Query('searchText') searchText: string,
    @Query('orderStatus') orderStatus: number,
    @Query('searchFromDate') searchFromDate: string,
    @Query('searchToDate') searchToDate: string,
    @Query('orderType') orderType: string,
    @Query('storeId') storeId: string,
    @Query('vector') vector: string,
  ) {
    const { take, skip, sort } = paginationDto;
    return this.serverOrderService.findAllServerOrder(
      searchFromDate,
      searchToDate,
      orderStatus,
      take,
      skip,
      storeId,
      sort,
      searchText,
      orderType,
      vector,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @Post('/post-feed')
  async createPostFeed(@Body() createPostFeed: CreatePostFeedDto) {
    const postFeed = await this.serverOrderService.addPostFeed(createPostFeed);
    return postFeed;
  }

  @ApiOkResponse({ description: '200. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @HttpCode(HttpStatus.OK)
  @Get('/details/:id/store/:storeId')
  async completeDetails(
    @Param('id', ParseIntPipe) id: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    const order = await this.serverOrderService.completeDetail(id, storeId);
    if (!order) {
      throw new NotFoundException('order not found');
    }
    return order;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(ExternalGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/order-queue/cancel-order/:id')
  async orderQueueCancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: CancelOrderDto,
  ): Promise<any> {
    const response = await this.serverOrderService.cancelOrder(id, data);
    return response;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(LocalAuthGuard, JwtAccessGuard, RolesGuard)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @HttpCode(HttpStatus.OK)
  @Post('/cancel-order/:id')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: CancelOrderDto,
  ): Promise<any> {
    const response = await this.serverOrderService.cancelOrder(id, data);
    return response;
  }

  @ApiOkResponse({ description: '200. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const order = await this.serverOrderService.findOne(id);
    if (!order) {
      throw new NotFoundException('order not found');
    }
    return order;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(ExternalGuard)
  @Post('/beer-guy')
  async beerguyUpdate(@Body() serverOrder: BeerGuyUpdateDto) {
    const response = await this.serverOrderService.handleBeerGuy(serverOrder);
    return response;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @HttpCode(HttpStatus.OK)
  @Patch('/finish-order/:id')
  async finishOrder(
    @Param('id', ParseIntPipe) serverOrderId: number,
    @Body()
    data: {
      orderDetails: CreateOrderDto;
      serverOrder: UpdateOrderDto;
      orderHistory: CreateOrderHistoryDto;
      customerProof: CreateCustomerProofDto;
      checkoutId?: string;
    },
  ): Promise<any> {
    const {
      orderHistory,
      orderDetails,
      serverOrder,
      customerProof,
      checkoutId,
    } = data;
    // console.log('data', data);
    const response = await this.serverOrderService.updateOrder(
      `${serverOrderId}`,
      orderDetails,
      serverOrder,
      orderHistory,
      customerProof,
      checkoutId,
    );
    return response;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
  )
  @HttpCode(HttpStatus.OK)
  @Patch('/:id')
  async updateServerOrder(
    @Param('id', ParseIntPipe) serverOrderId: number,
    @Body()
    data: {
      checkoutId?: string;
      createOrderDto: UpdateOrderDto;
      orderDetails: CreateOrderDto;
      orderHistory: CreateOrderHistoryDto;
      orderStatus: number;
      partial?: string;
      refundOrder: RefundOrderDto;
    },
  ): Promise<any> {
    const {
      orderHistory,
      orderStatus,
      orderDetails,
      refundOrder,
      partial,
      checkoutId,
      createOrderDto,
    } = data;
    const response = await this.serverOrderService.updateOrderDetails(
      serverOrderId,
      orderHistory,
      +orderStatus,
      orderDetails,
      refundOrder,
      createOrderDto,
      partial,
      checkoutId,
    );
    return response;
  }
}
