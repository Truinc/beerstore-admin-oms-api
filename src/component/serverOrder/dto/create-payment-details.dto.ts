import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { Column } from 'typeorm';

export class CreatePaymentDetailsDto {
  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(64)
  readonly cardType: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(64)
  readonly cardNumber: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'float',
    nullable: false,
  })
  readonly amount: number;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(64)
  readonly name: string;
}
