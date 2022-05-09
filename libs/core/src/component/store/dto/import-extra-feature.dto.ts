import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CreateStoreExtraFeaturesDto } from './create-store-extra-feature.dto';

export class ImportExtraFeatureDto extends CreateStoreExtraFeaturesDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly feature: string;

  @ApiProperty({ type: [Number] })
  @IsNotEmpty()
  @IsNumber()
  readonly store: number[];
}

export class CheckExtraFeatureDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  key: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  storeId: number;
}
