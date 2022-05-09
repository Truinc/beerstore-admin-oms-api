import { ApiProperty } from '@nestjs/swagger';
import { TokenDto } from './token.dto';

export class TokenResponseDto {
  constructor(body: TokenResponseDto | null = null) {
    if (body) {
      this.access = body.access;
      this.refresh = body.refresh;
    }
  }
  @ApiProperty({ type: TokenDto })
  readonly access: TokenDto;

  @ApiProperty({ type: TokenDto })
  readonly refresh: TokenDto;
}
