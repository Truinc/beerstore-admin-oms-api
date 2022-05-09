export class CreateCheckoutDto {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly address1: string;
  readonly address2: string;
  readonly city: string;
  readonly state_or_province: string;
  readonly state_or_province_code: string;
  readonly country_code: string;
  readonly postal_code: string;
  readonly phone: string;
}
