import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotAcceptableResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CheckoutsService } from './checkouts.service';
import { CreateCheckoutDto } from './dto';
import {
  AddBillingAddressDto,
  CrubsideAddBillingAddressDto,
  DeliveryAddBillingAddressDto,
  PickupAddBillingAddressDto,
} from './dto/addBillingAddress.dto';

@ApiTags('checkouts')
@ApiBearerAuth()
@Controller('checkouts')
export class CheckoutsController {
  constructor(private checkoutService: CheckoutsService) {}

  @ApiParam({ name: 'checkoutId', type: 'string', required: true })
  @ApiQuery({
    name: 'storeId',
    type: Number,
    example: '12321',
    required: true,
  })
  @ApiQuery({
    name: 'type',
    enum: ['DELIVERY', 'PICKUP', 'CRUBSIDE'],
    required: true,
    example: 'DELIVERY',
  })
  @HttpCode(HttpStatus.OK)
  @Get(':checkoutId')
  async getCheckout(
    @Param('checkoutId') checkoutId: string,
    @Query('storeId', ParseIntPipe) storeId: number,
    @Query('type', new DefaultValuePipe('DELIVERY')) type: string,
  ) {
    const response = await this.checkoutService.getCheckoutWithId(
      checkoutId,
      storeId,
      type,
    );
    return response;
  }

  /**
   * Add Checkout Billing Address API
   * @param checkoutId
   * @param consignments
   * @param available_shipping_options
   * @param body
   * @param res
   */
  @ApiParam({ name: 'checkoutId', type: 'string', required: true })
  @ApiParam({ name: 'storeId', type: 'number', required: true, example: 2002 })
  @ApiBody({ type: PickupAddBillingAddressDto, required: true })
  @HttpCode(HttpStatus.OK)
  @Post(':checkoutId/pickup/billing-address/:storeId')
  async addPickupBillingAddress(
    @Param('checkoutId') checkoutId: string,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: PickupAddBillingAddressDto,
  ) {
    const response = await this.checkoutService.addPickupBillingAddress(
      checkoutId,
      storeId,
      body,
    );
    return response;
  }

  // @ApiParam({ name: 'checkoutId', type: 'string', required: true })
  // @ApiParam({ name: 'storeId', type: 'number', required: true, example: 2002 })
  // @ApiBody({ type: DeliveryAddBillingAddressDto, required: true })
  // @HttpCode(HttpStatus.OK)
  // @Post(':checkoutId/delivery/billing-address/:storeId')
  // async addDeliveryBillingAddress(
  //   @Param('checkoutId') checkoutId: string,
  //   @Param('storeId', ParseIntPipe) storeId: number,
  //   @Body() body: DeliveryAddBillingAddressDto,
  // ) {
  //   const response = await this.checkoutService.addDeliveryBillingAddress(
  //     checkoutId,
  //     storeId,
  //     body,
  //   );
  //   return response;
  // }

  @ApiParam({ name: 'checkoutId', type: 'string', required: true })
  @ApiParam({ name: 'storeId', type: 'number', required: true, example: 2002 })
  @ApiBody({ type: CrubsideAddBillingAddressDto, required: true })
  @HttpCode(HttpStatus.OK)
  @Post(':checkoutId/crubside/billing-address/:storeId')
  async addCrubsideBillingAddress(
    @Param('checkoutId') checkoutId: string,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: CrubsideAddBillingAddressDto,
  ) {
    const response = await this.checkoutService.addCrubsideBillingAddress(
      checkoutId,
      storeId,
      body,
    );
    return response;
  }

  @ApiParam({ name: 'checkoutId', type: 'string', required: true })
  @HttpCode(HttpStatus.OK)
  @Post(':checkoutId/consignments')
  async addConsignmentAddress(@Param('checkoutId') checkoutId: string) {
    const response = await this.checkoutService.addShippingAddress(checkoutId);
    return response;
  }

  // @Put('/:checkoutId/billing-address/:addressId')
  // async updateBillingAddress(
  //   @Param('checkoutId') checkoutId,
  //   @Param('addressId') addressId,
  //   @Body() createCheckoutDto: CreateCheckoutDto,
  // ) {
  //   const response = await this.checkoutService.updateBillingAddress(
  //     checkoutId,
  //     addressId,
  //     createCheckoutDto,
  //   );
  //   return response;
  // }

  // @Post('/:checkoutId/consignments')
  // async addShippingAddress(
  //   @Param('checkoutId') checkoutId,
  //   @Body() createCheckoutDto: CreateCheckoutDto,
  // ) {
  //   const response = await this.checkoutService.addShippingAddress(
  //     checkoutId,
  //     createCheckoutDto,
  //   );
  //   return response;
  // }

  // @Put('/:checkoutId/consignments/:consignmentId')
  // async updateShippingAddress(
  //   @Param('checkoutId') checkoutId,
  //   @Param('consignmentId') consignmentId,
  //   @Body() createCheckoutDto: CreateCheckoutDto,
  // ) {
  //   const response = await this.checkoutService.updateShippingAddress(
  //     checkoutId,
  //     consignmentId,
  //     createCheckoutDto,
  //   );
  //   return response;
  // }

  // @Delete('/:checkoutId/consignments/:consignmentId')
  // async deleteShippingAddress(
  //   @Param('checkoutId') checkoutId,
  //   @Param('consignmentId') consignmentId,
  // ) {
  //   const response = await this.checkoutService.deleteShippingAddress(
  //     checkoutId,
  //     consignmentId,
  //   );
  //   return response;
  // }

  /**
   * Check keg in cart API
   * @param checkout_id
   * @param res
   */
  @ApiNotAcceptableResponse()
  @ApiOkResponse()
  @ApiQuery({ name: 'cartId', type: 'string', required: true })
  @ApiQuery({
    name: 'type',
    type: 'string',
    required: true,
    example: 'DELIVERY',
    enum: ['PICKUP', 'CRUBSIDE', 'DELIVERY'],
  })
  @HttpCode(HttpStatus.OK)
  @Get('/check/keg')
  async checkKeg(
    @Query('cartId') checkout_id: string,
    @Query('type', new DefaultValuePipe('PICKUP')) type: string,
  ) {
    if (type === 'DELIVERY') {
      const kegs = await this.checkoutService.checkKegInCart(checkout_id);
      return kegs;
    }
    return true;
  }

  /****
   * Check product inventory API
   * @param store_id
   * @param card_id
   * @param order_type
   * @param res
   */
  @ApiNotAcceptableResponse()
  @ApiOkResponse()
  @ApiQuery({ name: 'cardId', type: 'string', required: true })
  @ApiQuery({ name: 'storeId', type: 'number', required: true })
  @ApiQuery({
    name: 'type',
    type: 'string',
    required: true,
    example: 'DELIVERY',
    enum: ['PICKUP', 'CRUBSIDE', 'DELIVERY'],
  })
  @HttpCode(HttpStatus.OK)
  @Get('/check/inventory')
  async checkProductInventory(
    @Query('cardId') cardId: string,
    @Query('storeId', ParseIntPipe) storeId: number,
    @Query('type', new DefaultValuePipe('PICKUP')) type: string,
  ) {
    return this.checkoutService.checkProductInventory(cardId, storeId, type);
  }

  /**
   * Blacklist API
   * @param ip
   * @param email
   * @param phone
   * @param res
   */
  @ApiQuery({ name: 'ip', type: 'string', required: false })
  @ApiQuery({ name: 'email', type: 'string', required: false })
  @ApiQuery({ name: 'phone', type: 'string', required: false })
  @ApiQuery({
    name: 'type',
    type: 'string',
    required: true,
    example: 'PICKUP',
    enum: ['PICKUP', 'CRUBSIDE', 'DELIVERY'],
  })
  @HttpCode(HttpStatus.OK)
  @Get('blacklist/customer')
  async checkBlacklist(
    @Query('type', new DefaultValuePipe('PICKUP')) type: string,
    @Query('ip', new DefaultValuePipe('0.0.0.0')) ip: string,
    @Query('email', new DefaultValuePipe('tblacklist@tru.agency'))
    email: string,
    @Query('phone', new DefaultValuePipe('123-456-7890'))
    phone: string,
  ) {
    if (type === 'DELIVERY') {
      const response = await this.checkoutService.checkBlacklist(
        ip,
        email,
        phone,
      );
      return response;
    }
    return { result: 'success' };
  }
}
