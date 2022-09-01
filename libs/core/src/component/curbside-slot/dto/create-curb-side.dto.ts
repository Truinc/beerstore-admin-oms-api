import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CurbSideSlot } from '../entities/curb-side.entity';

export class CreateCurbSideDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly storeId: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly checkoutId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly customerId: number;

  @ApiProperty({ type: Date })
  @IsNotEmpty()
  readonly deliveryDate: Date;

  @ApiProperty({
    type: 'enum',
    enum: CurbSideSlot,
    default: CurbSideSlot.filled,
  })
  @IsNotEmpty()
  @IsEnum(CurbSideSlot)
  readonly status: CurbSideSlot = CurbSideSlot.filled;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  readonly slotStartTime: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  readonly slotEndTime: number;
}
