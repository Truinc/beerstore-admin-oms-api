import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly checkoutId: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly amount: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly token: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly holderName: string;
}

export class UpdatePaymentDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly amount: number;
}

export class Createtokenization {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly CardNumber: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly holderName: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly expireMonth: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly expireYear: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly vcc: number;
}

export class InitiatePaymentDto extends Createtokenization {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly checkoutId: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  readonly amount: number;
}

export class Continue3DS {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly cres: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  readonly threeDSSessionData: string;
}
