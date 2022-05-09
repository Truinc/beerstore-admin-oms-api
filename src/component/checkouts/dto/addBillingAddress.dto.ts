import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomFieldsParamDto {
  @ApiProperty({ type: String })
  @IsString()
  readonly field_id: string;

  @ApiProperty({
    type: String,
    description:
      'This can also be an array for fields that need to support list of values (e.g., a set of check boxes.). When doing a PUT or POST to the fieldValue with a pick list, the input must be a number. The response will be a string.',
  })
  @IsString()
  readonly field_value: string;
}

export class AddBillingAddressDto {
  @ApiProperty({
    type: String,
    description: `Salutation`,
  })
  @IsNotEmpty()
  @IsString()
  readonly salutation: string;

  @ApiProperty({ type: String })
  @IsString()
  readonly first_name: string = 'EmptyFirstName';

  @ApiProperty({ type: String })
  @IsString()
  readonly last_name: string = 'EmptyLastName';

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly company?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly address1: string = 'Empty Line1';

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly address2?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly city: string = 'EmptyCity';

  @ApiProperty({ type: String, description: 'Represents state or province.' })
  @IsString()
  @IsNotEmpty()
  readonly state_or_province: string = 'EmptyState';

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  readonly state_or_province_code?: string;

  @ApiProperty({
    type: String,
    required: true,
    description:
      'ISO 3166-1 alpha-2 country code. (See: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)',
  })
  @IsString()
  @IsOptional()
  readonly country_code?: string = 'CA';

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  readonly postal_code: string = 'L4T 2T9';

  @ApiProperty({
    type: String,
    description: `Match pattern: ^\\+?[1-9]\\d{1,14}(x\\d{1-5})?$`,
  })
  @IsString()
  @IsNotEmpty()
  readonly phone: string = '123356';

  @ApiProperty({
    type: String,
    description: `Pickup Date`,
  })
  @IsString()
  @IsNotEmpty()
  readonly date: string;

  @ApiProperty({
    type: String,
    description: `Pickup Time`,
  })
  @IsString()
  @IsNotEmpty()
  readonly time: string;

  @ApiProperty({
    type: String,
    description: `dob`,
  })
  @IsString()
  @IsNotEmpty()
  readonly dob: string;

  @ApiProperty({
    type: [CustomFieldsParamDto],
    required: false,
    description: 'array[customFields]',
  })
  @IsOptional()
  readonly custom_fields?: Array<CustomFieldsParamDto>;
}

export class PickupAddBillingAddressDto extends AddBillingAddressDto {
  @ApiProperty({
    type: String,
    description: `Payment Method`,
    example: 'Card',
    enum: ['Cash', 'Card'],
  })
  @IsOptional()
  @IsString()
  readonly payment_method?: string = 'Card';

  @ApiProperty({
    type: String,
    description: `Payment Method`,
    example: 'pickup',
    enum: ['pickup', 'delivery', 'crubside'],
  })
  @IsOptional()
  @IsString()
  readonly order_type?: string = 'pickup';
}
export class DeliveryAddBillingAddressDto extends AddBillingAddressDto {
  @ApiProperty({
    type: String,
    description: `Payment Method`,
    example: 'Cash',
    enum: ['Cash', 'Card'],
  })
  @IsNotEmpty()
  @IsString()
  readonly payment_method: string;

  @ApiProperty({
    type: String,
    description: `Delivery Instruction`,
  })
  @IsNotEmpty()
  @IsString()
  readonly message: string;

  @ApiProperty({
    type: String,
    description: `Buzzer`,
  })
  @IsNotEmpty()
  @IsString()
  readonly buzzer: string;

  @ApiProperty({
    type: String,
    description: `Order Type`,
    example: 'delivery',
    enum: ['pickup', 'delivery', 'crubside'],
  })
  @IsOptional()
  @IsString()
  readonly order_type?: string = 'delivery';
}
export class CrubsideAddBillingAddressDto extends AddBillingAddressDto {
  @ApiProperty({
    type: String,
    description: `Payment Method`,
    example: 'Card',
    enum: ['Cash', 'Card'],
  })
  @IsOptional()
  @IsString()
  readonly payment_method?: string = 'Card';

  @ApiProperty({
    type: String,
    description: `Payment Method`,
    example: 'delivery',
    enum: ['pickup', 'delivery', 'crubside'],
  })
  @IsOptional()
  @IsString()
  readonly order_type?: string = 'crubside';

  @ApiProperty({
    type: String,
    description: `Car Model`,
  })
  @IsString()
  @IsNotEmpty()
  readonly car_model: string;

  @ApiProperty({
    type: String,
    description: `Car Color`,
  })
  @IsString()
  @IsNotEmpty()
  readonly car_color: string;
}
