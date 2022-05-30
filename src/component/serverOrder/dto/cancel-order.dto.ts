import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrderEnum } from './search-order.dto';

export class CancelOrderDto {

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  readonly orderStatus: OrderEnum;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly orderType: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(99)
  readonly transactionId: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(200)
  @IsString()
  readonly cancellationBy: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly identifier: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly cancellationDate: string;

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
  @MaxLength(400)
  @IsString()
  readonly checkoutId?: string;
}
