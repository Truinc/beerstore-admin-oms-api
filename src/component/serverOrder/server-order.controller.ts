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
  )
  @UseGuards()
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
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @Post('post-feed')
  async createPostFeed(@Body() createPostFeed: CreatePostFeedDto) {
    const postFeed = await this.serverOrderService.addPostFeed(createPostFeed);
    return postFeed;
  }

  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.CREATED)
  @Post('customer-proof')
  async saveCustomerProof(@Body() createCustomerProof: CreateCustomerProofDto) {
    const customerProof = await this.serverOrderService.addCustomerProof(
      createCustomerProof,
    );
    return customerProof;
  }

  @ApiOkResponse({ description: '200. Success', type: CustomerProof })
  @ApiNotFoundResponse({ description: 'proof not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.OK)
  @Get('customer-proof/:orderId')
  async getCustomerProof(@Param('orderId', ParseIntPipe) orderId: number) {
    const customerProof = await this.serverOrderService.getCustomerProof(
      orderId,
    );
    if (!customerProof) {
      throw new NotFoundException('proof not found');
    }
    return customerProof;
  }

  @ApiOkResponse({ description: '204. Success', type: CustomerProof })
  @ApiNotFoundResponse({ description: 'proof not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('customer-proof/:id')
  async updateCustomerProof(
    @Param('id', ParseIntPipe) serverOrderId: number,
    @Body() customerProof: UpdateCustomerProofDto,
  ): Promise<CustomerProof> {
    const response = await this.serverOrderService.updateCustomerProof(
      serverOrderId,
      customerProof,
    );
    // update order on Big commerce data
    return response;
  }

  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('payment-detail')
  async savePaymentDetail(
    @Body() createPaymentDetail: CreatePaymentDetailsDto,
  ) {
    const paymentDetail = await this.serverOrderService.addPaymentDetail(
      createPaymentDetail,
    );
    return paymentDetail;
  }

  @ApiOkResponse({ description: '200. Success', type: PaymentDetails })
  @ApiNotFoundResponse({ description: 'payment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('payment-detail/:id')
  async getPaymentDetails(@Param('id', ParseIntPipe) id: number) {
    const paymentDetail = await this.serverOrderService.getPaymentDetail(id);
    if (!paymentDetail) {
      throw new NotFoundException('payment not found');
    }
    return paymentDetail;
  }

  @ApiOkResponse({ description: '200. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.OK)
  @Get('details/:id')
  async completeDetails(@Param('id', ParseIntPipe) id: number) {
    const order = await this.serverOrderService.completeDetail(id);
    if (!order) {
      throw new NotFoundException('order not found');
    }
    return order;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.OK)
  @Get('post-feed/:orderId')
  async fetchPostFeed(@Param('orderId', ParseIntPipe) orderId: number) {
    const postFeeds = await this.serverOrderService.findAllPostFeed(orderId);
    return postFeeds;
  }

  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'post feed not found' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('postFeed/:id')
  async deletePostFeed(@Param('id', ParseIntPipe) PostFeedId: number) {
    const response = await this.serverOrderService.removePostFeed(PostFeedId);
    return response;
  }

  @ApiOkResponse({ description: '204. Success', type: Order })
  @ApiNotFoundResponse({ description: 'order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(LocalAuthGuard, JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.OK)
  @Post('/cancel-order/:id')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      orderHistory: CreateOrderHistoryDto;
      orderDetails: CreateOrderDto;
      serverOrder: UpdateOrderDto;
    },
  ): Promise<any> {
    const { orderHistory, orderDetails, serverOrder } = data;
    const response = await this.serverOrderService.cancelOrder(
      id,
      orderHistory,
      orderDetails,
      serverOrder,
    );
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
  )
  @HttpCode(HttpStatus.OK)
  @Get(':id')
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
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.OK)
  @Patch('finish-order/:id')
  async finishOrder(
    @Param('id', ParseIntPipe) serverOrderId: number,
    @Body()
    data: {
      orderDetails: CreateOrderDto;
      serverOrder: UpdateOrderDto;
      orderHistory: CreateOrderHistoryDto;
      customerProof: CreateCustomerProofDto;
    },
  ): Promise<any> {
    const { orderHistory, orderDetails, serverOrder, customerProof } = data;
    console.log('data', data);
    const response = await this.serverOrderService.updateOrder(
      `${serverOrderId}`,
      orderDetails,
      serverOrder,
      orderHistory,
      customerProof,
    );
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
  )
  @HttpCode(HttpStatus.OK)
  @Patch('/:id')
  async updateServerOrder(
    @Param('id', ParseIntPipe) serverOrderId: number,
    @Body()
    data: {
      orderStatus: number;
      orderHistory: CreateOrderHistoryDto;
      orderDetails: CreateOrderDto;
    },
  ): Promise<any> {
    const { orderHistory, orderStatus, orderDetails } = data;
    const response = await this.serverOrderService.updateOrderDetails(
      serverOrderId,
      orderHistory,
      orderStatus,
      orderDetails,
    );
    return response;
  }

  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'order not found' })
  @UseGuards(JwtAccessGuard, UseGuards)
  @Roles(
    RolesEnum.superadmin,
    RolesEnum.customerservicerep,
    RolesEnum.storemanager,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  async deleteOrder(@Param('id', ParseIntPipe) serverOrderId: number) {
    const response = await this.serverOrderService.removeServerOrder(
      serverOrderId,
    );
    return response;
  }
}
