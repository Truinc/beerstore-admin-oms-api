import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  IsString,
  maxLength,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrderEnum } from '../entity/server-order.entity';

export class CreateOrderDto {
  constructor(body: CreateOrderDto | null = null) {
    if (body) {
      this.orderId = body.orderId;
      this.storeId = body.storeId;
      this.orderType = body.orderType;
      this.orderStatus = body.orderStatus;
      this.customerName = body.customerName;
      this.customerEmail = body.customerEmail;

      this.fulfillmentDate = body.fulfillmentDate;
      this.fulfillmentTime = body.fulfillmentTime;
      this.orderDate = body.orderDate;
    }
  }

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(99)
  readonly orderId: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(99)
  readonly storeId: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly orderType: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEnum(OrderEnum)
  readonly orderStatus: OrderEnum;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  readonly customerName: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsEmail()
  @IsString()
  @MaxLength(200)
  readonly customerEmail: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly fulfillmentDate: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsMilitaryTime()
  readonly fulfillmentTime: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly orderDate: string;

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
  @IsString()
  @MaxLength(500)
  readonly employeeNote: string;
}
