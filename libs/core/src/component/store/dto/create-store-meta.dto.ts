import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CreateStoreFeaturesDto } from './create-store-features.dto';
import { CreateStoreHoursDto } from './create-store-hours.dto';

export class CreateStoreMetaDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly id: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly storeId: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly locationName: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(200)
  readonly streetNo: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  readonly street: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly city: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly province: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly postalCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(70)
  readonly country: string;

  @ApiProperty({ type: Number })
  // @Min(-90)
  // @Max(90)
  readonly latitude: number;

  @ApiProperty({ type: Number })
  // @Min(-180)
  // @Max(180)
  readonly longitude: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  readonly isActive: number;

  @ApiProperty({ type: String })
  @IsString()
  readonly phone: string;

  @ApiProperty({ type: Array })
  readonly storeHours: CreateStoreHoursDto[];

  @ApiProperty({ type: Array })
  readonly storeFeatures: CreateStoreFeaturesDto[];
}
