import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../user/entity/user.entity';
@Injectable()
export default class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt').secret,
    });
  }

  async validate(decodedToken: { sub: User }) {
    try {
      const { sub } = decodedToken;
      if (sub && sub.id) {
        const user = await this.usersService.findOne(sub.id);
        return user;
      }
      throw new NotFoundException('user not found');
    } catch (err) {
      throw err;
    }
  }
}
