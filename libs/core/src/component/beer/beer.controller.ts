import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import {
  CacheInterceptor,
  CacheTTL,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BeerService } from './beer.service';
import { SearchBeerDto } from './dto/search-beer.dto';
import { Beer } from './entities/beer.entity';
// import { CreateBeerDto } from './dto/create-beer.dto';
// import { UpdateBeerDto } from './dto/update-beer.dto';

@ApiTags('beer')
@ApiBearerAuth()
@ApiExtraModels(Beer)
@Controller('beer')
export class BeerController {
  constructor(private readonly beerService: BeerService) {}

  // @Post()
  // create(@Body() createBeerDto: CreateBeerDto) {
  //   return this.beerService.create(createBeerDto);
  // }

  @ApiQuery({
    required: false,
    name: 'brand',
  })
  @ApiQuery({
    required: false,
    name: 'category',
    description: 'add , seperated ids, for e.g 403,404 ',
  })
  @ApiQuery({
    name: 'id',
    description: 'add , seperated ids, for e.g 403,404',
    required: false,
  })
  @ApiQuery({
    name: 'name',
    required: false,
  })
  @ApiQuery({
    name: 'images',
    required: false,
  })
  @ApiQuery({
    name: 'sku',
    description: 'add , seperated sku, for e.g 403,404 ',
    required: false,
  })
  @ApiQuery({
    name: 'include',
    description: 'variants,custom_fields,images,primary_image',
    required: false,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description:
      'Field name to sort by. Note: Since id increments when new products are added, you can use that field to sort by product create date. Allowed values:id,name,sku,price,date_modified,date_last_imported,inventory_level,is_visible,total_sold',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description:
      'Specifies the page number in a limited (paginated) list of products.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description:
      'Controls the number of items per page in a limited (paginated) list of products.',
  })
  @ApiQuery({
    name: 'category_name',
    required: false,
    description: 'Category name of beer like domestic',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(
    @Query('brand') brand: string,
    @Query('category') category: string,
    @Query('id') id: string,
    @Query('name') name: string,
    @Query('sku') sku: string,
    @Query('include') include: string,
    @Query('sort') sort: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('images') images: boolean,
    @Query('category_name') categoryName: string,
  ) {
    return this.beerService.findAll(
      brand,
      category,
      id,
      name,
      sku,
      include,
      sort,
      page,
      limit,
      images,
      categoryName,
    );
  }

  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('data-light')
  getAllBeerForApplication(@Query() data: SearchBeerDto) {
    const {
      brand,
      category,
      attribute,
      type,
      country,
      style,
      format,
      container,
      stock,
      sale,
      take,
      skip,
      customer,
    } = data;
    return this.beerService.filterBeer(
      brand,
      category,
      attribute,
      type,
      country,
      style,
      format,
      container,
      stock,
      sale,
      take,
      skip,
      customer,
    );
  }

  @ApiParam({ required: true, name: 'customerId', example: 0 })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(300)
  @Get(':sku/data-light/:customerId')
  findOne(
    @Param('sku') id: string,
    @Param('customerId', new DefaultValuePipe(0), ParseIntPipe)
    customerId: number,
  ) {
    return this.beerService.findOne(id, customerId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @ApiNoContentResponse()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Post(':productId/favorite/:customerId')
  async addfavoriteBeer(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    return this.beerService.addfavoriteBeer(productId, customerId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':customerId/favorite/:itemId')
  async deleteFavoriteStore(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.beerService.deleteFavoriteBeer(itemId, customerId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':customerId/favorite')
  async getfavoriteBeer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.beerService.getFavoriteBeers(customerId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('favorite/:wishlist_id')
  async deleteWishlist(
    @Param('wishlist_id', ParseIntPipe) wishlist_id: number,
  ) {
    return this.beerService.deleteWishlist(wishlist_id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateBeerDto: UpdateBeerDto) {
  //   return this.beerService.update(+id, updateBeerDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.beerService.remove(+id);
  // }
}
