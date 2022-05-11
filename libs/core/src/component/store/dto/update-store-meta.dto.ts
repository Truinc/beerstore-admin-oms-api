import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateDeliveryDto } from './create-delivery-fee.dto';
import { CreateStoreExtraFeaturesDto } from './create-store-extra-feature.dto';
import { CreateStoreMetaDto } from './create-store-meta.dto';

export class UpdateStoreMetaDto extends CreateStoreMetaDto {
  @ApiProperty({ type: [CreateStoreExtraFeaturesDto] })
  extraFeature: CreateStoreExtraFeaturesDto[];
  @ApiProperty({ type: CreateDeliveryDto })
  deliveryFee: CreateDeliveryDto;
  @IsOptional()
  featuresIds: number[];
}
