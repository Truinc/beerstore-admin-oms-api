import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import AuthService from '../auth.service';
import { User } from '../../user/entity/user.entity';

@Injectable()
export default class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<User> {
    try {
      const user = await this.authService.validateUser(username, password);
      return user;
    } catch (err) {
      throw err;
    }
  }
}
