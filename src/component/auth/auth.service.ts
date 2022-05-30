import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { omit } from 'lodash';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import SignUpDto from './dto/sign-up.dto';
import JwtTokensDto from './dto/jwt-tokens.dto';
import { RolesEnum, User } from '../user/entity/user.entity';
import { TokenEnum } from '../token/entity/token.entity';
import { SIGNINLOGS } from '@beerstore/core/utils';
@Injectable()
export default class AuthService {
  constructor(
    private usersService: UserService,
    private tokenService: TokenService,
  ) {}

  public async validateUser(
    username: string,
    password: string,
  ): Promise<null | User> {
    const user = await this.usersService.findWithUsername(username);
    if (!user) {
      throw new UnauthorizedException('Incorrect id or password.');
    }
    if (user.isActive !== 1) {
      this.usersService.upsertSignInlog(user.id, SIGNINLOGS.ACCOUNT_LOCKED);
      throw new UnauthorizedException(
        'Your account has been disabled. Please get in contact with your store manager to reset your password.',
      );
    }
    const passwordCompared = await bcrypt.compare(password, user.password);
    if (passwordCompared) {
      this.usersService.upsertSignInlog(
        user.id,
        SIGNINLOGS.LAST_SUCCESSFUL_LOGIN,
      );
      this.usersService.patch(user.id, {
        loginAttempts: 0,
        isActive: 1,
      });
      return user;
    }
    await this.usersService.upsertSignInlog(
      user.id,
      SIGNINLOGS.LAST_UNSUCCESSFUL_LOGIN,
    );
    const prevAttemptsCount = user?.loginAttempts || 0;
    if (prevAttemptsCount + 1 >= 3) {
      // make user inactive
      this.usersService.patch(user.id, {
        loginAttempts: prevAttemptsCount + 1,
        isActive: 0,
      });
      this.usersService.upsertSignInlog(
        user.id,
        SIGNINLOGS.LAST_UNSUCCESSFUL_LOGIN,
      );
      this.usersService.upsertSignInlog(user.id, SIGNINLOGS.ACCOUNT_LOCKED);
      throw new UnauthorizedException(
        'Your account has been disabled. Please get in contact with your store manager to reset your password.',
      );
    } else {
      this.usersService.patch(user.id, {
        isActive: 1,
        loginAttempts: prevAttemptsCount + 1,
      });
    }

    throw new UnauthorizedException('Incorrect id or password.');
  }

  /**
   * method to verify user credentials before cancelling order
   * @param username
   * @param password
   */
  public async validateCredentials(
    username: string,
    password: string,
  ): Promise<boolean> {
    const user = await this.usersService.findWithUsername(username);
    if (!user) {
      throw new UnauthorizedException('Incorrect EmployeeId');
    }
    const passwordCompared = await bcrypt.compare(password, user.password);
    if (passwordCompared) {
      return true;
    }
    throw new UnauthorizedException('Incorrect Password.');
  }

  public async login(username: string): Promise<JwtTokensDto> {
    try {
      const user = await this.usersService.findWithUsername(username);
      console.log('user', user);
      if (!user) {
        throw new UnauthorizedException('Incorrect ID or Password.');
      }

      if (user.isActive !== 1) {
        throw new UnauthorizedException(
          'Your account has been disabled. Please get in contact with your store manager to reset your password.',
        );
      }
      // const passwordCompared = await bcrypt.compare(password, user.password);
      // if (!passwordCompared) {
      //   throw new UnauthorizedException('Incorrect ID or Password.');
      // }
      const token = await this.tokenService.create(user);
      return new JwtTokensDto({
        user: omit(user, ['password']),
        tokens: token,
      });
    } catch (err) {
      throw err;
    }
  }

  public async register(payload: SignUpDto): Promise<JwtTokensDto> {
    try {
      const user = await this.usersService.create(payload);
      const token = await this.tokenService.create(user);
      return new JwtTokensDto({
        user: user,
        tokens: token,
      });
    } catch (err) {
      console.log('err', err.message);
      throw err;
    }
  }

  public async logout(refreshToken: string) {
    const token = await this.tokenService.findWithPayload({
      type: TokenEnum.refresh,
      token: refreshToken,
    });
    if (!token) {
      throw new NotFoundException('token not found');
    }
    return this.tokenService.delete(token.id);
  }

  public async forget(email: string) {
    const user = await this.usersService.findWithEmail(email);
    if (!user) {
      console.log('user not found');
      throw new NotFoundException('user not found');
    }
    return this.tokenService.generateResetToken(user);
  }

  public async reset(token: string, newPassword: string) {
    try {
      const tokenObj = await this.tokenService.verifyToken(
        token,
        TokenEnum.reset,
      );
      const user = await this.usersService.findOne(tokenObj.user.id);
      if (!user) {
        throw new NotFoundException('user not found');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.id, { password: hashedPassword });
      return this.tokenService.deleteMany({ type: TokenEnum.reset, user });
    } catch (err) {
      throw err;
    }
  }

  public async refresh(refreshToken: string) {
    try {
      const tokenObj = await this.tokenService.verifyToken(
        refreshToken,
        TokenEnum.refresh,
      );
      const user = await this.usersService.findOne(tokenObj.user.id);
      if (!user) {
        throw new NotFoundException('user not found');
      }
      await this.tokenService.delete(tokenObj.id);
      return this.tokenService.create(user);
    } catch (err) {
      throw err;
    }
  }
}
