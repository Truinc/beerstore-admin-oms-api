import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  createRepack(@Body() createCartDto: CreateCartDto) {
    return this.cartService.createRepack(createCartDto);
  }

  @ApiParam({
    name: 'id',
    type: String,
    example: 'f0158338-55f6-43bf-98b0-6bd850cca3bf',
  })
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
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('storeId', ParseIntPipe) storeId: number,
    @Query('type', new DefaultValuePipe('DELIVERY')) type: string,
  ) {
    return this.cartService.getCartWithDeliveryFee(id, storeId, type);
  }

  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }

  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post(':cartId/items')
  addItemToCart(
    @Param('cartId') id: string,
    @Body() createCartDto: CreateCartDto,
  ) {
    return this.cartService.addItemToCart(id, createCartDto);
  }

  @ApiOkResponse()
  @ApiBody({
    description: 'Do not request with zero(0) quantity',
    type: UpdateCartDto,
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':cartId/items/:itemId')
  updateItemToCart(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
    @Body() payload: UpdateCartDto,
  ) {
    const response = this.cartService.updateItemToCart(cartId, itemId, payload);
    return response;
  }

  @ApiNoContentResponse({
    description: 'Cart is empty and cartId is no longer vaild',
  })
  @ApiOkResponse({ description: 'Cart is not Empty, it contains other items' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':cartId/items/:itemId')
  async deleteItemToCart(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.cartService.deleteItemToCart(cartId, itemId);
    if (!response) {
      return res.status(HttpStatus.NO_CONTENT).send();
    }
    return response;
  }
}
