import { ApiProperty } from '@nestjs/swagger';
import { UpdateCustomerProofDto } from './update-customer-proof.dto';
import { UpdateOrderDto } from './update-order.dto';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OrderEnum } from './search-order.dto';

export class BeerGuyUpdateDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(99)
  readonly orderId?: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly orderStatus?: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly orderType?: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  readonly deliveryId: number;

  @ApiProperty({ type: String })
  @IsString()
  readonly deliveryGuyName: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly cancellationDate: string;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // @MaxLength(200)
  // @IsString()
  // readonly cancellationBy: string;

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
}
