import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { OrderEnum } from 'src/component/serverOrder/entity/server-order.entity';

// class OrderProducts {
//   readonly name: string;
//   readonly quantity: number;
//   readonly price_inc_tax: number;
//   readonly price_ex_tax: number;
// }
export class CreateOrderDto {
  @ApiProperty({ type: Number })
  @IsOptional()
  status_id: number;

  products: [
    {
      name: string;
      quantity: number;
      price_inc_tax: number;
      price_ex_tax: number;
    },
  ];
}
