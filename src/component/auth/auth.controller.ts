import {
  Body,
  Controller,
  HttpCode,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ForbiddenException,
  HttpStatus,
  InternalServerErrorException,
  Query,
  Patch,
} from '@nestjs/common';

import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';

import LocalAuthGuard from '@beerstore/core/guards/local-auth.guard';
import AuthService from './auth.service';
import SignInDto from './dto/sign-in.dto';
import JwtTokensDto from './dto/jwt-tokens.dto';
import SignUpDto from './dto/sign-up.dto';
import RefreshTokenDto from './dto/refresh-token.dto';
import ForgetPasswordDto from './dto/forget-password.dto';
import { TokenResponseDto } from '../token/dto/token-response.dto';
import RolesGuard from '../../guards/role.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesEnum } from '../user/entity/user.entity';

@ApiTags('auth')
@ApiExtraModels(TokenResponseDto)
@Controller('auth')
export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({ type: SignInDto })
  @ApiOkResponse()
  @ApiInternalServerErrorResponse({ description: 'Internal server issue' })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() payload: SignInDto): Promise<JwtTokensDto> {
    try {
      const { username } = payload;
      const token = await this.authService.login(username);
      return token;
    } catch (error) {
      throw error;
    }
  }

  @ApiBody({ type: SignUpDto })
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() payload: SignUpDto): Promise<JwtTokensDto> {
    try {
      const token = await this.authService.register(payload);
      return token;
    } catch (error) {
      throw error;
    }
  }

  @ApiBody({ type: RefreshTokenDto })
  @ApiNoContentResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() payload: RefreshTokenDto) {
    try {
      const { refreshToken } = payload;
      await this.authService.logout(refreshToken);
      return;
    } catch (error) {
      throw error;
    }
  }

  @ApiBody({ type: ForgetPasswordDto })
  @ApiNoContentResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @Post('forget-password')
  async forget(@Body() payload: ForgetPasswordDto) {
    try {
      const { email } = payload;
      const token = await this.authService.forget(email);
      return token;
    } catch (error) {
      throw error;
    }
  }

  @ApiBody({
    schema: {
      properties: {
        password: {
          type: 'string',
        },
      },
    },
  })
  @ApiNoContentResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('reset-password')
  async reset(
    @Query('token') token: string,
    @Body() body: { password: string },
  ) {
    try {
      const { password } = body;
      return this.authService.reset(token, password);
    } catch (error) {
      throw error;
    }
  }

  @ApiBody({
    schema: {
      properties: {
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '200. Success',
    status: HttpStatus.OK,
    type: TokenResponseDto,
  })
  @ApiInternalServerErrorResponse()
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      const { refreshToken } = body;
      return this.authService.refresh(refreshToken);
    } catch (error) {
      throw error;
    }
  }
}
