import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class KioskSearchBeerDto {
  @ApiPropertyOptional({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
  })
  @IsOptional()
  category?: string = '';

  @ApiPropertyOptional({
    type: String,
    required: false,
  })
  @IsOptional()
  attribute?: string = '';

  @ApiPropertyOptional({
    type: String,
    required: false,
  })
  @IsOptional()
  type?: string = '';

  @ApiPropertyOptional({
    type: String,
    required: false,
  })
  @IsOptional()
  country?: string = '';

  @ApiPropertyOptional({
    type: String,
    required: false,
  })
  @IsOptional()
  style?: string = '';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'pack size ids',
  })
  @IsOptional()
  format?: string = '';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'e.g. CanId or bottle id',
  })
  @IsOptional()
  container?: string = '';

  @ApiPropertyOptional({
    type: Boolean,
    required: false,
    default: true,
  })
  @IsOptional()
  stock?: string = 'true';

  @ApiPropertyOptional({
    type: Boolean,
    required: false,
    default: false,
  })
  @IsOptional()
  sale?: string = 'false';

  //   @ApiPropertyOptional({
  //     type: Boolean,
  //     required: false,
  //     default: false,
  //   })
  //   @IsOptional()
  //   keg?: boolean = false;

  @ApiPropertyOptional({
    type: Number,
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    required: false,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    type: Number,
    required: false,
    default: 0,
  })
  @IsOptional()
  customer?: string = '0';
}
