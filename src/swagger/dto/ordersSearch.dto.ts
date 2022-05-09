import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class OrdersSearchDto {
  @ApiPropertyOptional({
    type: String,
    description: 'enter customer name or order id (optional)',
  })
  @IsOptional()
  searchText?: string = '';

  @ApiPropertyOptional({
    type: String,
    description: 'enter order status code',
  })
  @IsOptional()
  orderStatus?: string = '';
}
