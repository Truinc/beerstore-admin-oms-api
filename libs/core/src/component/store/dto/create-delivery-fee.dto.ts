import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({ type: Number })
  @IsOptional()
  id?: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly fee: number;
}
