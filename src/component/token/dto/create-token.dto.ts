import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTokenDto {
  @ApiProperty({ type: String })
  @IsString()
  readonly type: string;

  @ApiProperty({
    type: String,
    description: '1 minutes OR 31 days OR 9999 years',
  })
  @IsString()
  readonly expires: string;
}
