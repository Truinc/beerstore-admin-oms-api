import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class Products {
  
  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  id: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @MinLength(1)
  @MaxLength(99)
  name: string;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  quantity: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @MinLength(1)
  @MaxLength(99)
  sku: string;

}
export class CreateOrderDto {
  @ApiProperty({ type: Number })
  @IsOptional()
  status_id: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  shipping_cost_ex_tax?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  shipping_cost_inc_tax?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  refunded_amount?: number;
  
  // @ApiProperty({ type: String })
  // @IsOptional()
  // @IsString()
  // staff_notes?: string;

  @Type(() => Products)
  @IsOptional()
  @ValidateNested()
  readonly products?: Products[];

}
