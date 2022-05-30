import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import RolesGuard from '@beerstore/core/guards/role.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesEnum } from '../user/entity/user.entity';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { Token } from './entity/token.entity';
import { TokenService } from './token.service';
@ApiTags('token')
@ApiBearerAuth()
@ApiExtraModels(Token)
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @ApiBody({ type: CreateTokenDto })
  @ApiOkResponse({ type: Token })
  @ApiBadRequestResponse({
    description: '400. ValidationException',
  })
  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createTokenDto: CreateTokenDto) {
    return this.tokenService.generateSepcialToken(createTokenDto);
  }

  @ApiOkResponse({ description: '200. Success', type: Token })
  @ApiNotFoundResponse({ description: 'token not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin)
  @HttpCode(HttpStatus.OK)
  @Get(':token')
  async findOne(@Param('token') token: string) {
    const tokenObj = await this.tokenService.getToken(token);
    if (!tokenObj) {
      throw new NotFoundException('token not found');
    }
    return tokenObj;
  }

  @ApiBody({ type: UpdateTokenDto })
  @ApiOkResponse({ description: '204. Success', type: UpdateTokenDto })
  @ApiNotFoundResponse({ description: 'token not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin)
  @HttpCode(HttpStatus.OK)
  @Patch(':token')
  update(
    @Param('token') token: string,
    @Body() updateTokenDto: UpdateTokenDto,
  ) {
    return this.tokenService.update(token, updateTokenDto);
  }

  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Unauthorized Response' })
  @ApiNotFoundResponse({ description: 'token not found' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(RolesEnum.superadmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':token')
  remove(@Param('token') token: string) {
    return this.tokenService.remove(token);
  }
}
