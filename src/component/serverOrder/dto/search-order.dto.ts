import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OrderEnum {
  admin = 'admin',
  staff = 'staff',
  guest = 'guest',
  manager = 'manager',
}

export class SearchOrderDto {
  @ApiPropertyOptional({
    type: String,
    description: 'enter customer name or order id (optional)',
  })
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'enter order status code',
  })
  @IsOptional()
  @IsEnum(OrderEnum)
  orderStatus?: OrderEnum;
}
