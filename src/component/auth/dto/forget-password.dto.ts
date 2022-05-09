import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export default class ForgetPasswordDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}
