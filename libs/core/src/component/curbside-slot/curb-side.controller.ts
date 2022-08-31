import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import { CreateCurbSideDto } from './dto/create-curb-side.dto';
import { CurbSide } from './entities/curb-side.entity';
import { CurbSideService } from './curb-side.service';
import { UpdateCurbSideDto } from './dto/update-curb-side.dto';
import { HoursFormatPipe } from '@beerstore/core/pipes/hours-format.pipe';

@ApiTags('curbside')
@Controller('curbside')
@ApiBearerAuth()
@ApiExtraModels(CurbSide)
export class CurbSideController {
  constructor(private curbSideService: CurbSideService) {}

  @ApiQuery({
    required: true,
    name: 'slot',
    type: String,
    example: '10:00 AM - 10:30 AM',
  })
  @ApiBadRequestResponse({
    description: '400. ValidationException',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('book')
  async create(
    @Body()
    curbSide: CreateCurbSideDto,
    @Query('slot', HoursFormatPipe)
    slot: { start: number; end: number; value: string },
  ) {
    Object.assign(curbSide, {
      slotStartTime: slot.start,
      slotEndTime: slot.end,
    });
    const curbSideEntry = await this.curbSideService.create(curbSide);
    return curbSideEntry;
  }

  @ApiQuery({
    required: true,
    name: 'slot',
    type: String,
    example: '10:00 AM - 10:30 AM',
  })
  @ApiNoContentResponse()
  @Post('release')
  async release(
    @Body()
    curbSide: UpdateCurbSideDto,
    @Query('slot', HoursFormatPipe)
    slot: { start: number; end: number; value: string },
  ) {
    Object.assign(curbSide, {
      slotStartTime: slot.start,
      slotEndTime: slot.end,
    });
    return this.curbSideService.release(curbSide);
  }

  @ApiQuery({
    required: false,
    name: 'date',
    type: String,
    example: '2022-04-27',
  })
  @ApiQuery({
    required: false,
    name: 'storeId',
    type: String,
    example: '2002',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll(
    @Query('date') date: Date,
    @Query('storeId', ParseIntPipe) storeId: number,
  ) {
    const curbSideEntries = await this.curbSideService.findAll(date, storeId);
    return curbSideEntries;
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const curbSideEntry = await this.curbSideService.findById(id);
    if (!curbSideEntry) {
      throw new NotFoundException('curbside entry not found');
    }
    return curbSideEntry;
  }

  @ApiQuery({
    required: true,
    name: 'date',
    type: String,
    example: '2022-04-27',
  })
  @ApiQuery({
    required: true,
    name: 'slot',
    type: String,
    example: '10:00 AM - 10:30 AM',
  })
  @ApiQuery({
    required: true,
    name: 'storeId',
    type: Number,
    example: 2002,
  })
  @ApiQuery({
    required: false,
    name: 'checkoutId',
    type: String,
    example: '12ercy56wvsd567djhwd8w7-wdbjwd7wdbjhwd',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('verify/slot')
  async checkSlot(
    @Query('date') date: Date,
    @Query('slot', HoursFormatPipe)
    slot: { start: number; end: number; value: string },
    @Query('storeId', ParseIntPipe) storeId: number,
    @Query('checkoutId') checkoutId: string,
  ) {
    return this.curbSideService.verifySlot(date, slot, storeId, checkoutId);
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.curbSideService.delete(id);
  }
}
