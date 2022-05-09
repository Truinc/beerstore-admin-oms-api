import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entity/user.entity';

@Injectable()
export default class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'accessToken',
) {
  constructor(configService: ConfigService, private usersService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
