import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrderEnum } from '../entity/server-order.entity';

export class CreateServerOrderDto {
  constructor(body: CreateServerOrderDto | null = null) {
    if (body) {
      this.orderId = body.orderId;
      this.storeId = body.storeId;
      // this.orderTime = body.orderTime;
      this.orderType = body.orderType;
      this.orderDateTime = body.orderDateTime;
      this.orderStatus = body.orderStatus;
      this.customerName = body.customerName;
      this.employeeNote = body.employeeNote;
      this.customerEmail = body.customerEmail;
      this.cancellationBy = body.cancellationBy;
      this.fulfillmentDate = body.fulfillmentDate;
      this.fulfillmentTime = body.fulfillmentTime;
      this.cancellationDate = body.cancellationDate;
      this.cancellationReason = body.cancellationReason;
      this.transactionId = body.transactionId;
      this.orderData = body.orderData;
      this.productsData = body.productsData;
      this.paymentData = body.paymentData;
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
  @MaxLength(50)
  readonly fulfillmentTime: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly orderDateTime: string;

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
  @MaxLength(99)
  readonly transactionId: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly employeeNote: string;

  @IsOptional()
  readonly productsData: any;

  @IsOptional()
  readonly orderData: any;

  @IsOptional()
  readonly paymentData: any;
}
