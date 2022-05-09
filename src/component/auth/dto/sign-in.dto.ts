import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export default class SignInDto {
  constructor(body: SignInDto | null = null) {
    if (body) {
      this.username = body.username;
      this.password = body.password;
    }
  }

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  readonly username: string = '';

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  readonly password: string = '';
}
