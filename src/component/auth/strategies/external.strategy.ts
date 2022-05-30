import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenEnum } from 'src/component/token/entity/token.entity';

@Injectable()
export default class ExternalStrategy extends PassportStrategy(
  Strategy,
  'external',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt').secret,
    });
  }

  async validate(decodedToken: { type: TokenEnum }) {
    try {
      const { type } = decodedToken;
      if (type != TokenEnum.orderqueue) {
        throw new UnauthorizedException('Not an orderqueue token');
      }
      return true;
    } catch (err) {
      throw err;
    }
  }
}
