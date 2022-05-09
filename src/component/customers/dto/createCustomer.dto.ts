import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly first_name: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly last_name: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly password: string;
  // readonly _authentication: {
  //   readonly force_password_reset: boolean;
  // };

  @ApiProperty({ type: String })
  @IsOptional()
  readonly company?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  readonly phone?: string;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly store_credit?: number;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly customer_group_id?: number;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly notes?: string;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly tax_exempt_category?: string;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly accepts_marketing?: boolean;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly reset_pass_on_login?: boolean;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // readonly channel_ids: number[];

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  salutation: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  dob: string;
}

export class ChangePasswordDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;
}

export class CustomerAttributeDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  salutation: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  dob: string;
}
