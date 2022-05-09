import { ApiProperty } from '@nestjs/swagger';

export enum RolesEnum {
  admin = 'admin',
  customer = 'customer',
}

export class Customer {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  company: string;

  @ApiProperty({ type: String })
  first_name: string;

  @ApiProperty({ type: String })
  last_name: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: String })
  form_fields?: null;

  @ApiProperty({ type: String })
  date_created: string;

  @ApiProperty({ type: String })
  date_modified: string;

  @ApiProperty({ type: String })
  store_credit: string;

  @ApiProperty({ type: String })
  registration_ip_address: string;

  @ApiProperty({ type: Number })
  customer_group_id: number;

  @ApiProperty({ type: String })
  notes: string;

  @ApiProperty({ type: String })
  tax_exempt_category: string;

  @ApiProperty({ type: Boolean })
  reset_pass_on_login: boolean;

  @ApiProperty({ type: Boolean })
  accepts_marketing: boolean;

  @ApiProperty({ type: Object })
  addresses: Addresses;
  dob: string;
  salutation: string;
}
export interface Addresses {
  url: string;
  resource: string;
}
