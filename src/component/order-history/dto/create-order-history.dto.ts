import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrderHistoryDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(99)
  readonly orderId: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  readonly orderStatus: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly name: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly identifier: string;

  
  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  readonly employeeId?: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly password?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly employeeNote?: string;
}
