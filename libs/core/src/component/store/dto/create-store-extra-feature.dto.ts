import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoreExtraFeaturesDto {
  @ApiProperty({ type: Number })
  @IsOptional()
  id?: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  feature: string;

  @ApiProperty({ type: Number, default: 1 })
  isActive: number;
}
