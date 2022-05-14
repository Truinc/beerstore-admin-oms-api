import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateOrderHistoryDto } from 'src/component/order-history/dto/create-order-history.dto';
import { CreateOrderDto } from 'src/component/orders/dto';
import { UpdateOrderDto } from './update-order.dto';

export class CancelOrderDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(99)
  readonly orderId: string;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateOrderDto)
  createOrderDto!: CreateOrderDto;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateOrderDto)
  serverOrder: UpdateOrderDto;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateOrderHistoryDto)
  createOrderHistoryDto: CreateOrderHistoryDto;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(99)
  readonly username: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(99)
  readonly password: string;
}
