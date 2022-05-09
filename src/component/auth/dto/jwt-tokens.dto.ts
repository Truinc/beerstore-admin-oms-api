import { TokenResponseDto } from '../../token/dto/token-response.dto';
import { User } from '../../user/entity/user.entity';

export default class JwtTokensDto {
  constructor(body: JwtTokensDto | null = null) {
    if (body) {
      this.user = body.user;
      this.tokens = body.tokens;
    }
  }
  user: User;
  tokens?: TokenResponseDto;
}
