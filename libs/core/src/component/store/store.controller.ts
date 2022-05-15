import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Put,
  BadGatewayException,
  ParseFloatPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  // CacheInterceptor,
  // UseInterceptors,
  // CacheTTL,
  Post,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import { PaginationInputPipe } from '../../pipes/pagination-input.pipe';
import { PaginationInputDto } from '../../swagger/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../swagger/paginated-response';
import { ImportExtraFeatureDto } from './dto/import-extra-feature.dto';
import { ImportDeliveryFeeDto } from './dto/import-delivery-fee.dto';
import { UpdateStoreMetaDto } from './dto/update-store-meta.dto';
import { Store } from './entities/store.entity';
import { StoreService } from './store.service';
import { CreateDto } from './dto/create.dto';
import { HolidayHours } from './entities/holidayHrs.entity';
import { RequestUser } from '@beerstore/core/decorators/request-user';
import { User } from 'src/component/user/entity/user.entity';
@ApiTags('store')
@Controller('store')
@ApiBearerAuth()
@ApiExtraModels(Store)
export class StoreController {
  constructor(private storeService: StoreService) {}

  // @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  // @UseGuards(JwtAccessGuard)
  // @Get('/:id')
  // async getStoreById(@Param('id', ParseIntPipe) id: number) {
  //   const store = await this.storeService.findById(id);
  //   if (!store) {
  //     throw new NotFoundException('store not found');
  //   }
  //   return store;
  // }

  @ApiQuery({
    required: false,
    name: 'id',
    type: Number,
  })
  @ApiQuery({
    required: false,
    name: 'street',
    description: 'search in locationName ',
  })
  @ApiQuery({
    required: false,
    name: 'location',
    description: 'search in locationName ',
  })
  @ApiQuery({
    required: false,
    name: 'postal',
  })
  @ApiQuery({
    required: false,
    name: 'city',
  })
  @ApiQuery({
    required: true,
    name: 'lat',
    type: 'number',
  })
  @ApiQuery({
    required: true,
    name: 'lang',
    type: 'number',
  })
  @ApiPaginatedResponse(Store)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(300)
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/selectedStores')
  async getStores(
    @RequestUser() user: User,
    @Query('location') location: string,
    @Query('street') street: string,
    @Query('postal') postal_code: string,
    @Query('city') city: string,
    @Query('id') id: number,
    @Query(PaginationInputPipe) paginationDto: PaginationInputDto,
  ) {
    try {
      console.log('user', user);
      const { take, skip, sort } = paginationDto;
      return this.storeService.storesList(
        location,
        street,
        postal_code,
        city,
        take,
        skip,
        sort,
        id,
        user,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @ApiQuery({
    required: false,
    name: 'customerId',
    type: Number,
  })
  @ApiQuery({
    required: false,
    name: 'formatHour',
    type: Boolean,
  })
  @ApiQuery({
    required: false,
    name: 'date',
    type: String,
    example: '2022-04-27',
  })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(300)
  @UseGuards(JwtAccessGuard)
  @Get(':id')
  async getStoreByStoreId(
    @Param('id', ParseIntPipe) storeId: number,
    @Query('customerId', new DefaultValuePipe(0), ParseIntPipe)
    customerId: number,
    @Query('formatHour', new DefaultValuePipe(true), ParseBoolPipe)
    format: boolean,
    @Query('date', new DefaultValuePipe(new Date())) dateForHoliday: Date,
  ) {
    const store = await this.storeService.getStore(
      storeId,
      format,
      customerId,
      dateForHoliday,
    );
    if (!store) {
      throw new NotFoundException('store not found');
    }
    return store;
  }

  @ApiQuery({
    required: false,
    name: 'id',
    type: Number,
  })
  @ApiQuery({
    required: false,
    name: 'street',
    description: 'search in locationName ',
  })
  @ApiQuery({
    required: false,
    name: 'location',
    description: 'search in locationName ',
  })
  @ApiQuery({
    required: false,
    name: 'postal',
  })
  @ApiQuery({
    required: false,
    name: 'city',
  })
  @ApiQuery({
    required: true,
    name: 'lat',
    type: 'number',
  })
  @ApiQuery({
    required: true,
    name: 'lang',
    type: 'number',
  })
  @ApiQuery({
    required: false,
    name: 'customer',
    type: 'number',
    example: 0,
  })
  @ApiQuery({
    required: false,
    name: 'date',
    type: String,
    example: '2022-04-27',
  })
  @ApiPaginatedResponse(Store)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(300)
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lang', ParseFloatPipe) lang: number,
    @Query('location') location: string,
    @Query('street') street: string,
    @Query('postal') postal_code: string,
    @Query('city') city: string,
    @Query('id') id: number,
    @Query('customer', new DefaultValuePipe(0), ParseIntPipe) customer: number,
    @Query('date', new DefaultValuePipe(new Date())) dateForHoliday: Date,
    @Query(PaginationInputPipe) paginationDto: PaginationInputDto,
  ) {
    try {
      if (lat < -90 || lat > 90) {
        throw new BadGatewayException('valid lat range -90 to 90');
      }
      if (lang < -180 || lang > 180) {
        throw new BadGatewayException('valid lang range -180 to 180');
      }
      const { take, skip, sort } = paginationDto;

      return this.storeService.filterStores(
        lat,
        lang,
        location,
        street,
        postal_code,
        city,
        take,
        skip,
        sort,
        customer,
        dateForHoliday,
        id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Put(':storeId')
  async update(
    @Param('storeId', ParseIntPipe) id: number,
    @Body() query: UpdateStoreMetaDto,
  ) {
    const { extraFeature, deliveryFee } = query;
    delete query.extraFeature;
    delete query.deliveryFee;

    try {
      const store = await this.storeService.updateStore(
        id,
        query,
        deliveryFee,
        extraFeature,
      );
      return store;
    } catch (error) {
      throw error;
    }
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @Get('/:storeId/storeFeatures')
  async getStoreFeaturesById(@Param('storeId', ParseIntPipe) id: number) {
    const storeFeatures = await this.storeService.findStoreFeaturesById(id);
    if (!storeFeatures) {
      throw new NotFoundException('features not found');
    }
    return storeFeatures;
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @Get(':storeId/storeHours')
  async getStoreHoursById(@Param('storeId', ParseIntPipe) id: number) {
    const storeHours = await this.storeService.findStoreHoursById(id);
    if (!storeHours) {
      throw new NotFoundException('features not found');
    }
    return storeHours;
  }

  @UseGuards(JwtAccessGuard)
  @Get('sap/sync')
  async getTest() {
    return this.storeService.startTransction();
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @ApiBody({ type: [ImportExtraFeatureDto] })
  @Post('all/extraFeature/import')
  async importextraFeaturedata(@Body() data: ImportExtraFeatureDto[]) {
    return await this.storeService.importextraFeaturedata(data);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @ApiBody({ type: [ImportDeliveryFeeDto] })
  @Post('all/deliveyFee/import')
  async importDeliveryFee(@Body() data: ImportDeliveryFeeDto[]) {
    return await this.storeService.importDeliveryFee(data);
  }

  @Get('all/extra/features')
  async getAllExtraFeatures() {
    return [
      {
        code: 'pickup_available',
        feature: 'In-Store Pickup',
      },
      {
        code: 'delivery_available',
        feature: 'Home Delivery',
      },
      {
        code: 'curbside_available',
        feature: 'Crubside Pickup',
      },

      {
        code: 'drive_thru_available',
        feature: 'Drive-thru',
      },

      // {
      //   code: 'not_accept_empties',
      //   feature: 'Currently Not Accepting Empties',
      // },
      {
        code: 'kiosk_available',
        feature: 'Self-Serve Kiosk',
      },
      {
        code: 'accept_empties',
        feature: 'Empties Accepted',
      },
    ];
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Post(':storeId/favorite/:customerId')
  async addfavoriteStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    return this.storeService.addfavoriteStore(storeId, customerId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':storeId/favorite/:customerId')
  async deleteFavoriteStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    return this.storeService.deleteFavoriteStore(storeId, customerId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('favorite/:customerId')
  async getfavoriteStore(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lang', ParseFloatPipe) lang: number,
  ) {
    const { take, skip } = paginationDto;
    return this.storeService.getFavoriteStore(
      customerId,
      take,
      skip,
      lat,
      lang,
    );
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Post('save/holiday/calender')
  async insertHoliday(@Body() query: CreateDto) {
    const { holidayHour, holidayInfo } = query;
    const holiday = await this.storeService.saveHoliday(
      holidayHour,
      holidayInfo,
    );
    return holiday;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNoContentResponse({ description: 'Calender deleted' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('save/holiday/calender/:parentId')
  async deleteHoliday(@Param('parentId', ParseIntPipe) parentId: number) {
    return this.storeService.deleteHoliday(parentId);
  }

  @ApiPaginatedResponse(HolidayHours)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/save/holiday/calender')
  async findAllholidays(
    @Query(PaginationInputPipe) paginationDto: PaginationInputDto,
  ) {
    try {
      const { take, skip, sort } = paginationDto;
      const holidays = await this.storeService.findAllHolidays(
        take,
        skip,
        sort,
      );
      return holidays;
    } catch (error) {
      throw error;
    }
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
    @Query('store_id') store_id: number,
    @Query('min_date_created') min_date_created: Date,
    @Query('max_date_created') max_date_created: Date,
    @Query('limit') limit: number,
  ) {
    return this.storeService.getAllOrders(
      status_id,
      store_id,
      min_date_created,
      max_date_created,
      limit,
    );
  }
}
