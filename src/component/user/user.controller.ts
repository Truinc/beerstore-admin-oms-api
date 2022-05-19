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
  Req,
} from '@nestjs/common';
import { Request as HttpRequest } from 'express';
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import RolesGuard from '@beerstore/core/guards/role.guard';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesEnum, User } from './entity/user.entity';
import { ApiPaginatedResponse } from '@beerstore/core/swagger/paginated-response';
import { PaginationInputDto } from '@beerstore/core/swagger/dto/pagination.dto';
import { PaginationInputPipe } from '@beerstore/core/pipes/pagination-input.pipe';
import { UpdateUserDto } from './dto/update-user.dto';

import { Roles } from '../../decorators/roles.decorator';
@ApiTags('user')
@ApiBearerAuth()
@ApiExtraModels(User)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({
    status: 204,
    description: '204. Created',
    type: CreateUserDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk, RolesEnum.storemanager)
  @HttpCode(HttpStatus.OK)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiPaginatedResponse(User)
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk, RolesEnum.storemanager)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
    @Query('search') search: string,
    @Query('isManager') isManager: number,
    @Req() request: HttpRequest & { user: User },
  ) {
    const {
      user: { role, usersStores },
    } = request || { usersStores: [] };
    try {
      const { take, skip, sort } = paginationDto;
      const users = this.userService.findAll(
        take,
        skip,
        role,
        usersStores,
        sort,
        search,
        isManager,
      );
      return users;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiOkResponse({ description: '200. Success', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'user not found' })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const user = this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  @ApiOkResponse({ description: '204. Success', type: User })
  @ApiNotFoundResponse({ description: 'user not found' })
  @Post('/verify')
  verifyUser(@Body() query) {
    const { username, password } = query;
    return this.userService.verify(username, password);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.(id, updateUserDto);
  // }
  @ApiNoContentResponse({ description: '200. Success', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'user not found' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk, RolesEnum.storemanager)
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const user = this.userService.update(id, updateUserDto);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiNoContentResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk)
  @Delete('usersStores')
  async removeUserStores(
    @Query('userId') userId: number,
    @Query('storeId') storeId: number,
  ) {
    try {
      return await this.userService.removeUserStore(userId, storeId);
    } catch (error) {
      throw error;
    }
  }

  @ApiNoContentResponse({ description: '200. Success', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'user not found' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.delete(id);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @ApiNoContentResponse()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk)
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @Post('add-password')
  addPassword(@Body() body: { id: number; password: string }) {
    try {
      const { id, password } = body;
      const updatedUser = this.userService.updatePassword(id, password);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  @ApiNoContentResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.storemanager, RolesEnum.ithelpdesk)
  @Get('userMeta/:id')
  async getUserMeta(@Param('id', ParseIntPipe) id: number) {
    const userMeta = await this.userService.getUserMeta(id);
    return userMeta;
  }

  @ApiNoContentResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin, RolesEnum.ithelpdesk)
  @Post('status/:id')
  async setUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isActive: number },
  ) {
    try {
      const { isActive } = body;
      const user = await this.userService.setStatus(id, isActive);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

// @ApiBadRequestResponse({
//   schema: {
//     type: 'object',
//     example: {
//       name: 'Munish',
//       error: 'Bad Request',
//     },
//   },
//   description: '400. ValidationException',
// })
