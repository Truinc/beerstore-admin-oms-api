// require more fields to be added
export class CreateOrderDto {
  readonly billing_address: {
    first_name: string;
    last_name: string;
    street_1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    country_iso2: string;
    email: string;
  };
  readonly products: [
    {
      name: string;
      quantity: number;
      price_inc_tax: number;
      price_ex_tax: number;
    },
  ];
}
