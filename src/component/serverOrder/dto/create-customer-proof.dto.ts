import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum PhotoIdEnum {
  ontariodriverlicence = 'ontariodriverlicence',
  outofprovincedriverlicence = 'outofprovincedriverlicence',
  photohealthcard = 'photohealthcard',
  passport = 'passport',
  otherphotoid = 'otherphotoid',
  notchecked25 = 'notchecked25',
}

export class CreateCustomerProofDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(99)
  readonly orderId: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  readonly underInfluence: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  readonly dobBefore: number;

  @ApiProperty({ type: String, default: '' })
  @IsOptional()
  readonly photoId: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(99)
  readonly driverName: string;
}
