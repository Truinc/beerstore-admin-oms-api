import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';

export class TokenDto {
  constructor(body: TokenDto | null = null) {
    if (body) {
      this.token = body.token;
      this.expires = body.expires;
    }
  }

  @ApiProperty({ type: String })
  @IsString()
  readonly token: string;

  @ApiProperty({ type: Date })
  @IsDate()
  readonly expires: Date;
}
