import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateDeliveryDto } from './create-delivery-fee.dto';

export class ImportDeliveryFeeDto extends CreateDeliveryDto {
  @ApiProperty({ type: [Number] })
  @IsNotEmpty()
  @IsNumber()
  readonly store: number[];
}
