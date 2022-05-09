import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStoreHoursDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly weekDay: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  @MinLength(1)
  readonly fromHour: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  @MinLength(1)
  readonly toHour: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;
}
