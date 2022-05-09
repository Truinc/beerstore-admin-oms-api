import {
  Controller,
  Get,
  Query,
  ParseBoolPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  CacheInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import { BeerCategoryService } from './beer-category.service';
import { BeerCategory } from './entities/beer-category.entity';
// import { CreateBeerCategoryDto } from './dto/create-beer-category.dto';
// import { UpdateBeerCategoryDto } from './dto/update-beer-category.dto';

@ApiTags('beer-category')
@ApiBearerAuth()
@ApiExtraModels(BeerCategory)
@Controller('beer-category')
export class BeerCategoryController {
  constructor(private readonly beerCategoryService: BeerCategoryService) {}

  // @Post()
  // create(@Body() createBeerCategoryDto: CreateBeerCategoryDto) {
  //   return this.beerCategoryService.create(createBeerCategoryDto);
  // }

  @ApiQuery({
    required: false,
    name: 'search',
  })
  @ApiQuery({
    required: false,
    name: 'category',
    description: 'add , seperated ids, for e.g 403,404 ',
  })
  @ApiQuery({
    name: 'group',
    type: 'boolean',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(
    @Query('search') search: string,
    @Query('category') category: string,
    @Query('group', ParseBoolPipe) group: boolean,
  ) {
    return this.beerCategoryService.findAll(search, category, group);
  }

  @ApiQuery({
    required: false,
    name: 'search',
  })
  @ApiQuery({
    required: false,
    name: 'category',
    description: 'add , seperated ids, for e.g 403,404 ',
  })
  @ApiQuery({
    name: 'group',
    type: 'boolean',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor)
  @Get('data-light')
  getAllCategory(
    @Query('search') search: string,
    @Query('category') category: string,
    @Query('group', ParseBoolPipe) group: boolean,
  ) {
    return this.beerCategoryService.getAllCategory(search, category, group);
  }

  // @Get(':id')
  // findOne(@Param('id', ParseIntPipe) id: number) {
  //   return this.beerCategoryService.findOne(id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateBeerCategoryDto: UpdateBeerCategoryDto,
  // ) {
  //   return this.beerCategoryService.update(+id, updateBeerCategoryDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.beerCategoryService.remove(+id);
  // }
}
