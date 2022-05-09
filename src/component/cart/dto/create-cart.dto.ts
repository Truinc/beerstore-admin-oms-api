import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LineItems {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly variant_id: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly quantity: number;
}

export class LineItem {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly product_id: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly variant_id: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly quantity: number;
}

export class CreateCartDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly product_id: number;

  @ApiProperty({ type: [LineItems] })
  readonly line_item: LineItems[];

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  readonly customer_id: number;
}
