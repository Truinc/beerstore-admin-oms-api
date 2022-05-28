import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OrderEnum } from 'src/component/serverOrder/entity/server-order.entity';

// class OrderProducts {
//   readonly name: string;
//   readonly quantity: number;
//   readonly price_inc_tax: number;
//   readonly price_ex_tax: number;
// }

export class Products {
  @ApiProperty({ type: String })
  @IsOptional()
  @MinLength(1)
  @MaxLength(99)
  name: string;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  quantity: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  price_inc_tax: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  price_ex_tax: number;
}
export class CreateOrderDto {
  @ApiProperty({ type: Number })
  @IsOptional()
  status_id: number;


  @ApiProperty({ type: Number })
  @IsOptional()
  shipping_cost_ex_tax?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  shipping_cost_inc_tax?: number;

  @Type(() => Products)
  @IsOptional()
  @ValidateNested()
  readonly info?: Products[];

  // products: [
  //   {
  //     name: string;
  //     quantity: number;
  //     price_inc_tax: number;
  //     price_ex_tax: number;
  //   },
  // ];
}
