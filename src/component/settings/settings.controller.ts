import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';

import { ApiPaginatedResponse } from '@beerstore/core/swagger/paginated-response';
import { PaginationInputDto } from '@beerstore/core/swagger/dto/pagination.dto';
import { PaginationInputPipe } from '@beerstore/core/pipes/pagination-input.pipe';
import { Settings } from './entity/settings.entity';
import { CreateSettingDto } from './dto/create-settings.dto';
import { UpdateSettingDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@ApiExtraModels(Settings)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiBody({ type: CreateSettingDto })
  @ApiOkResponse({
    status: 204,
    description: '204. Created',
    type: CreateSettingDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSettingDto: CreateSettingDto[]) {
    try {
      const setting = await this.settingsService.create(createSettingDto);
      return setting;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiPaginatedResponse(Settings)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
  ) {
    try {
      const { take, skip, sort } = paginationDto;
      const settings = this.settingsService.findAll(take, skip, sort);
      return settings;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiOkResponse({ description: '200. Success', type: Settings })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'setting not found' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const user = this.settingsService.findOne(id);
    if (!user) {
      throw new NotFoundException('setting not found');
    }
    return user;
  }

  @ApiNoContentResponse({ description: '200. Success', type: Settings })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'setting not found' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    try {
      const setting = this.settingsService.update(id, updateSettingDto);
      return setting;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiNoContentResponse({ description: '200. Success', type: Settings })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'setting not found' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const setting = await this.settingsService.delete(id);
      return setting;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
