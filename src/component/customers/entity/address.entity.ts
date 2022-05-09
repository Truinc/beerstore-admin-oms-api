import { ApiProperty } from '@nestjs/swagger';

export enum AddressType {
  residential = 'residential',
  commercial = 'commercial',
}
export class Address {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  address1: string;
  @ApiProperty({ type: String })
  address2: string;

  @ApiProperty({ type: 'enum', enum: AddressType })
  address_type: AddressType;

  @ApiProperty({ type: String })
  city: string;

  @ApiProperty({ type: String })
  company: string;

  @ApiProperty({ type: String })
  country: string;

  @ApiProperty({ type: String })
  country_code: string;

  @ApiProperty({ type: Number })
  customer_id: number;

  @ApiProperty({ type: String })
  first_name: string;

  @ApiProperty({ type: String })
  last_name: string;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: String })
  postal_code: string;

  @ApiProperty({ type: String })
  state_or_province: string;
}
