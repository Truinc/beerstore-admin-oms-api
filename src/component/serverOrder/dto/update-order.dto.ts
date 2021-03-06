import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { OrderEnum } from '../entity/server-order.entity';

export class UpdateOrderDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(99)
  readonly orderId?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(99)
  readonly storeId?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly orderType?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly orderStatus?: OrderEnum;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly customerName?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  // @IsEmail()
  @IsString()
  @MaxLength(200)
  readonly customerEmail?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsDate()
  readonly fulfillmentDate?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsMilitaryTime()
  readonly fulfillmentTime?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsDate()
  readonly orderDate?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly cancellationDate: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(200)
  @IsString()
  readonly cancellationBy: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(500)
  @IsString()
  readonly cancellationReason: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(500)
  @IsString()
  readonly cancellationNote?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly transactionId?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly amount?: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly volumeTotalHL?: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly singleUnits?: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly packUnits2_6?: number;


  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly packUnits8_18?: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly packUnits_24Plus?: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  readonly productTotal?: number;
}
