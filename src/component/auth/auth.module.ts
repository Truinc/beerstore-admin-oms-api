import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
// import { JwtModule } from '@nestjs/jwt';

import AuthService from './auth.service';
import AuthController from './auth.controller';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';
import LocalStrategy from './strategies/local.strategy';
import JwtAccessStrategy from './strategies/jwt-access.strategy';
import ExternalStrategy from './strategies/external.strategy';

@Module({
  imports: [PassportModule, ConfigModule, UserModule, TokenModule],
  providers: [AuthService, LocalStrategy, JwtAccessStrategy, ExternalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
// forwardRef(() => UserModule),
//

// JwtAccessStrategy,
// JwtRefreshStrategy,
