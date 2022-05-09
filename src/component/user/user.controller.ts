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
  @Roles(RolesEnum.staff)
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
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(
    @Query(PaginationInputPipe)
    paginationDto: PaginationInputDto,
    @Query('search') search: string,
  ) {
    try {
      const { take, skip, sort } = paginationDto;
      const users = this.userService.findAll(take, skip, sort, search);
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
  @UseGuards(JwtAccessGuard)
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

  @ApiNoContentResponse({ description: '200. Success', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'user not found' })
  @UseGuards(JwtAccessGuard)
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
  @Roles(RolesEnum.manager)
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
  @Get('signinlogs/:id')
  getSignInLogs(@Param('id', ParseIntPipe) id: number) {
    try {
      const signInLogs = this.userService.getSignInLogs(id);
      return signInLogs;
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
