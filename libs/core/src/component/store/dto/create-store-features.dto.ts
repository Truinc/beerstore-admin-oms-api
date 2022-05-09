import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStoreFeaturesDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly feature: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;
}
